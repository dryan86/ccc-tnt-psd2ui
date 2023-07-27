"use strict";
// based on https://github.com/jpeg-js/jpeg-js
/*
   Copyright 2011 notmasteryet

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeJpeg = void 0;
var dctZigZag = new Int32Array([
    0,
    1, 8,
    16, 9, 2,
    3, 10, 17, 24,
    32, 25, 18, 11, 4,
    5, 12, 19, 26, 33, 40,
    48, 41, 34, 27, 20, 13, 6,
    7, 14, 21, 28, 35, 42, 49, 56,
    57, 50, 43, 36, 29, 22, 15,
    23, 30, 37, 44, 51, 58,
    59, 52, 45, 38, 31,
    39, 46, 53, 60,
    61, 54, 47,
    55, 62,
    63
]);
var dctCos1 = 4017; // cos(pi/16)
var dctSin1 = 799; // sin(pi/16)
var dctCos3 = 3406; // cos(3*pi/16)
var dctSin3 = 2276; // sin(3*pi/16)
var dctCos6 = 1567; // cos(6*pi/16)
var dctSin6 = 3784; // sin(6*pi/16)
var dctSqrt2 = 5793; // sqrt(2)
var dctSqrt1d2 = 2896; // sqrt(2) / 2
var maxResolutionInMP = 100; // Don't decode more than 100 megapixels
var maxMemoryUsageBytes = 64 * 1024 * 1024; // Don't decode if memory footprint is more than 64MB
var totalBytesAllocated = 0; // avoid unexpected OOMs from untrusted content.
function requestMemoryAllocation(increaseAmount) {
    var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
    if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
        var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
        throw new Error("Max memory limit exceeded by at least ".concat(exceededAmount, "MB"));
    }
    totalBytesAllocated = totalMemoryImpactBytes;
}
function buildHuffmanTable(codeLengths, values) {
    var length = 16;
    while (length > 0 && !codeLengths[length - 1])
        length--;
    var code = [{ children: [], index: 0 }];
    var k = 0;
    var p = code[0];
    for (var i = 0; i < length; i++) {
        for (var j = 0; j < codeLengths[i]; j++) {
            p = code.pop();
            p.children[p.index] = values[k];
            while (p.index > 0) {
                if (code.length === 0)
                    throw new Error('Could not recreate Huffman Table');
                p = code.pop();
            }
            p.index++;
            code.push(p);
            while (code.length <= i) {
                var q = { children: [], index: 0 };
                code.push(q);
                p.children[p.index] = q.children;
                p = q;
            }
            k++;
        }
        if (i + 1 < length) {
            // p here points to last code
            var q = { children: [], index: 0 };
            code.push(q);
            p.children[p.index] = q.children;
            p = q;
        }
    }
    return code[0].children;
}
function decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive) {
    var mcusPerLine = frame.mcusPerLine;
    var progressive = frame.progressive;
    var startOffset = offset;
    var bitsData = 0;
    var bitsCount = 0;
    function readBit() {
        if (bitsCount > 0) {
            bitsCount--;
            return (bitsData >> bitsCount) & 1;
        }
        bitsData = data[offset++];
        if (bitsData == 0xFF) {
            var nextByte = data[offset++];
            if (nextByte)
                throw new Error("unexpected marker: ".concat(((bitsData << 8) | nextByte).toString(16)));
            // unstuff 0
        }
        bitsCount = 7;
        return bitsData >>> 7;
    }
    function decodeHuffman(tree) {
        var node = tree;
        while (true) {
            node = node[readBit()];
            if (typeof node === 'number')
                return node;
            if (node === undefined)
                throw new Error('invalid huffman sequence');
        }
    }
    function receive(length) {
        var n = 0;
        while (length > 0) {
            n = (n << 1) | readBit();
            length--;
        }
        return n;
    }
    function receiveAndExtend(length) {
        var n = receive(length);
        if (n >= 1 << (length - 1))
            return n;
        return n + (-1 << length) + 1;
    }
    function decodeBaseline(component, zz) {
        var t = decodeHuffman(component.huffmanTableDC);
        var diff = t === 0 ? 0 : receiveAndExtend(t);
        zz[0] = (component.pred += diff);
        var k = 1;
        while (k < 64) {
            var rs = decodeHuffman(component.huffmanTableAC);
            var s = rs & 15;
            var r = rs >> 4;
            if (s === 0) {
                if (r < 15)
                    break;
                k += 16;
                continue;
            }
            k += r;
            var z = dctZigZag[k];
            zz[z] = receiveAndExtend(s);
            k++;
        }
    }
    function decodeDCFirst(component, zz) {
        var t = decodeHuffman(component.huffmanTableDC);
        var diff = t === 0 ? 0 : (receiveAndExtend(t) << successive);
        zz[0] = (component.pred += diff);
    }
    function decodeDCSuccessive(_component, zz) {
        zz[0] |= readBit() << successive;
    }
    var eobrun = 0;
    function decodeACFirst(component, zz) {
        if (eobrun > 0) {
            eobrun--;
            return;
        }
        var k = spectralStart, e = spectralEnd;
        while (k <= e) {
            var rs = decodeHuffman(component.huffmanTableAC);
            var s = rs & 15;
            var r = rs >> 4;
            if (s === 0) {
                if (r < 15) {
                    eobrun = receive(r) + (1 << r) - 1;
                    break;
                }
                k += 16;
                continue;
            }
            k += r;
            var z = dctZigZag[k];
            zz[z] = receiveAndExtend(s) * (1 << successive);
            k++;
        }
    }
    var successiveACState = 0;
    var successiveACNextValue = 0;
    function decodeACSuccessive(component, zz) {
        var k = spectralStart;
        var e = spectralEnd;
        var r = 0;
        while (k <= e) {
            var z = dctZigZag[k];
            var direction = zz[z] < 0 ? -1 : 1;
            switch (successiveACState) {
                case 0: // initial state
                    var rs = decodeHuffman(component.huffmanTableAC);
                    var s = rs & 15;
                    r = rs >> 4; // this was new variable in old code
                    if (s === 0) {
                        if (r < 15) {
                            eobrun = receive(r) + (1 << r);
                            successiveACState = 4;
                        }
                        else {
                            r = 16;
                            successiveACState = 1;
                        }
                    }
                    else {
                        if (s !== 1)
                            throw new Error('invalid ACn encoding');
                        successiveACNextValue = receiveAndExtend(s);
                        successiveACState = r ? 2 : 3;
                    }
                    continue;
                case 1: // skipping r zero items
                case 2:
                    if (zz[z]) {
                        zz[z] += (readBit() << successive) * direction;
                    }
                    else {
                        r--;
                        if (r === 0)
                            successiveACState = successiveACState == 2 ? 3 : 0;
                    }
                    break;
                case 3: // set value for a zero item
                    if (zz[z]) {
                        zz[z] += (readBit() << successive) * direction;
                    }
                    else {
                        zz[z] = successiveACNextValue << successive;
                        successiveACState = 0;
                    }
                    break;
                case 4: // eob
                    if (zz[z]) {
                        zz[z] += (readBit() << successive) * direction;
                    }
                    break;
            }
            k++;
        }
        if (successiveACState === 4) {
            eobrun--;
            if (eobrun === 0)
                successiveACState = 0;
        }
    }
    function decodeMcu(component, decode, mcu, row, col) {
        var mcuRow = (mcu / mcusPerLine) | 0;
        var mcuCol = mcu % mcusPerLine;
        var blockRow = mcuRow * component.v + row;
        var blockCol = mcuCol * component.h + col;
        // If the block is missing, just skip it.
        if (component.blocks[blockRow] === undefined)
            return;
        decode(component, component.blocks[blockRow][blockCol]);
    }
    function decodeBlock(component, decode, mcu) {
        var blockRow = (mcu / component.blocksPerLine) | 0;
        var blockCol = mcu % component.blocksPerLine;
        // If the block is missing, just skip it.
        if (component.blocks[blockRow] === undefined)
            return;
        decode(component, component.blocks[blockRow][blockCol]);
    }
    var componentsLength = components.length;
    var component;
    var decodeFn;
    if (progressive) {
        if (spectralStart === 0) {
            decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
        }
        else {
            decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
        }
    }
    else {
        decodeFn = decodeBaseline;
    }
    var mcu = 0;
    var mcuExpected;
    if (componentsLength == 1) {
        mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
    }
    else {
        mcuExpected = mcusPerLine * frame.mcusPerColumn;
    }
    if (!resetInterval)
        resetInterval = mcuExpected;
    var h;
    var v;
    var marker;
    while (mcu < mcuExpected) {
        // reset interval stuff
        for (var i = 0; i < componentsLength; i++)
            components[i].pred = 0;
        eobrun = 0;
        if (componentsLength == 1) {
            component = components[0];
            for (var n = 0; n < resetInterval; n++) {
                decodeBlock(component, decodeFn, mcu);
                mcu++;
            }
        }
        else {
            for (var n = 0; n < resetInterval; n++) {
                for (var i = 0; i < componentsLength; i++) {
                    component = components[i];
                    h = component.h;
                    v = component.v;
                    for (var j = 0; j < v; j++) {
                        for (var k = 0; k < h; k++) {
                            decodeMcu(component, decodeFn, mcu, j, k);
                        }
                    }
                }
                mcu++;
                // If we've reached our expected MCU's, stop decoding
                if (mcu === mcuExpected)
                    break;
            }
        }
        if (mcu === mcuExpected) {
            // Skip trailing bytes at the end of the scan - until we reach the next marker
            do {
                if (data[offset] === 0xFF) {
                    if (data[offset + 1] !== 0x00) {
                        break;
                    }
                }
                offset += 1;
            } while (offset < data.length - 2);
        }
        // find marker
        bitsCount = 0;
        marker = (data[offset] << 8) | data[offset + 1];
        if (marker < 0xFF00)
            throw new Error('marker was not found');
        if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
            offset += 2;
        }
        else {
            break;
        }
    }
    return offset - startOffset;
}
function buildComponentData(component) {
    var lines = [];
    var blocksPerLine = component.blocksPerLine;
    var blocksPerColumn = component.blocksPerColumn;
    var samplesPerLine = blocksPerLine << 3;
    // Only 1 used per invocation of this function and garbage collected after invocation, so no need to account for its memory footprint.
    var R = new Int32Array(64);
    var r = new Uint8Array(64);
    // A port of poppler's IDCT method which in turn is taken from:
    //   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
    //   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
    //   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
    //   988-991.
    function quantizeAndInverse(zz, dataOut, dataIn) {
        var qt = component.quantizationTable;
        var p = dataIn;
        // dequant
        for (var i = 0; i < 64; i++) {
            p[i] = zz[i] * qt[i];
        }
        // inverse DCT on rows
        for (var i = 0; i < 8; ++i) {
            var row = 8 * i;
            // check for all-zero AC coefficients
            if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 &&
                p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 &&
                p[7 + row] == 0) {
                var t_1 = (dctSqrt2 * p[0 + row] + 512) >> 10;
                p[0 + row] = t_1;
                p[1 + row] = t_1;
                p[2 + row] = t_1;
                p[3 + row] = t_1;
                p[4 + row] = t_1;
                p[5 + row] = t_1;
                p[6 + row] = t_1;
                p[7 + row] = t_1;
                continue;
            }
            // stage 4
            var v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
            var v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
            var v2 = p[2 + row];
            var v3 = p[6 + row];
            var v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
            var v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
            var v5 = p[3 + row] << 4;
            var v6 = p[5 + row] << 4;
            // stage 3
            var t = (v0 - v1 + 1) >> 1;
            v0 = (v0 + v1 + 1) >> 1;
            v1 = t;
            t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
            v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
            v3 = t;
            t = (v4 - v6 + 1) >> 1;
            v4 = (v4 + v6 + 1) >> 1;
            v6 = t;
            t = (v7 + v5 + 1) >> 1;
            v5 = (v7 - v5 + 1) >> 1;
            v7 = t;
            // stage 2
            t = (v0 - v3 + 1) >> 1;
            v0 = (v0 + v3 + 1) >> 1;
            v3 = t;
            t = (v1 - v2 + 1) >> 1;
            v1 = (v1 + v2 + 1) >> 1;
            v2 = t;
            t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
            v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
            v7 = t;
            t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
            v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
            v6 = t;
            // stage 1
            p[0 + row] = v0 + v7;
            p[7 + row] = v0 - v7;
            p[1 + row] = v1 + v6;
            p[6 + row] = v1 - v6;
            p[2 + row] = v2 + v5;
            p[5 + row] = v2 - v5;
            p[3 + row] = v3 + v4;
            p[4 + row] = v3 - v4;
        }
        // inverse DCT on columns
        for (var i = 0; i < 8; ++i) {
            var col = i;
            // check for all-zero AC coefficients
            if (p[1 * 8 + col] == 0 && p[2 * 8 + col] == 0 && p[3 * 8 + col] == 0 &&
                p[4 * 8 + col] == 0 && p[5 * 8 + col] == 0 && p[6 * 8 + col] == 0 &&
                p[7 * 8 + col] == 0) {
                var t_2 = (dctSqrt2 * dataIn[i + 0] + 8192) >> 14;
                p[0 * 8 + col] = t_2;
                p[1 * 8 + col] = t_2;
                p[2 * 8 + col] = t_2;
                p[3 * 8 + col] = t_2;
                p[4 * 8 + col] = t_2;
                p[5 * 8 + col] = t_2;
                p[6 * 8 + col] = t_2;
                p[7 * 8 + col] = t_2;
                continue;
            }
            // stage 4
            var v0 = (dctSqrt2 * p[0 * 8 + col] + 2048) >> 12;
            var v1 = (dctSqrt2 * p[4 * 8 + col] + 2048) >> 12;
            var v2 = p[2 * 8 + col];
            var v3 = p[6 * 8 + col];
            var v4 = (dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048) >> 12;
            var v7 = (dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048) >> 12;
            var v5 = p[3 * 8 + col];
            var v6 = p[5 * 8 + col];
            // stage 3
            var t = (v0 - v1 + 1) >> 1;
            v0 = (v0 + v1 + 1) >> 1;
            v1 = t;
            t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
            v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
            v3 = t;
            t = (v4 - v6 + 1) >> 1;
            v4 = (v4 + v6 + 1) >> 1;
            v6 = t;
            t = (v7 + v5 + 1) >> 1;
            v5 = (v7 - v5 + 1) >> 1;
            v7 = t;
            // stage 2
            t = (v0 - v3 + 1) >> 1;
            v0 = (v0 + v3 + 1) >> 1;
            v3 = t;
            t = (v1 - v2 + 1) >> 1;
            v1 = (v1 + v2 + 1) >> 1;
            v2 = t;
            t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
            v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
            v7 = t;
            t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
            v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
            v6 = t;
            // stage 1
            p[0 * 8 + col] = v0 + v7;
            p[7 * 8 + col] = v0 - v7;
            p[1 * 8 + col] = v1 + v6;
            p[6 * 8 + col] = v1 - v6;
            p[2 * 8 + col] = v2 + v5;
            p[5 * 8 + col] = v2 - v5;
            p[3 * 8 + col] = v3 + v4;
            p[4 * 8 + col] = v3 - v4;
        }
        // convert to 8-bit integers
        for (var i = 0; i < 64; ++i) {
            var sample = 128 + ((p[i] + 8) >> 4);
            dataOut[i] = sample < 0 ? 0 : sample > 0xFF ? 0xFF : sample;
        }
    }
    requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);
    for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
        var scanLine = blockRow << 3;
        for (var i = 0; i < 8; i++)
            lines.push(new Uint8Array(samplesPerLine));
        for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
            quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);
            var offset = 0;
            var sample = blockCol << 3;
            for (var j = 0; j < 8; j++) {
                var line = lines[scanLine + j];
                for (var i = 0; i < 8; i++)
                    line[sample + i] = r[offset++];
            }
        }
    }
    return lines;
}
function clampTo8bit(a) {
    return a < 0 ? 0 : a > 255 ? 255 : a;
}
function parse(data) {
    var self = {
        width: 0,
        height: 0,
        comments: [],
        adobe: undefined,
        components: [],
        exifBuffer: undefined,
        jfif: undefined,
    };
    var maxResolutionInPixels = maxResolutionInMP * 1000 * 1000;
    var offset = 0;
    function readUint16() {
        var value = (data[offset] << 8) | data[offset + 1];
        offset += 2;
        return value;
    }
    function readDataBlock() {
        var length = readUint16();
        var array = data.subarray(offset, offset + length - 2);
        offset += array.length;
        return array;
    }
    function prepareComponents(frame) {
        var maxH = 0, maxV = 0;
        for (var componentId in frame.components) {
            if (frame.components.hasOwnProperty(componentId)) {
                var component = frame.components[componentId];
                if (maxH < component.h)
                    maxH = component.h;
                if (maxV < component.v)
                    maxV = component.v;
            }
        }
        var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
        var mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
        for (var componentId in frame.components) {
            if (frame.components.hasOwnProperty(componentId)) {
                var component = frame.components[componentId];
                var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
                var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines / 8) * component.v / maxV);
                var blocksPerLineForMcu = mcusPerLine * component.h;
                var blocksPerColumnForMcu = mcusPerColumn * component.v;
                var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
                var blocks = [];
                // Each block is a Int32Array of length 64 (4 x 64 = 256 bytes)
                requestMemoryAllocation(blocksToAllocate * 256);
                for (var i = 0; i < blocksPerColumnForMcu; i++) {
                    var row = [];
                    for (var j = 0; j < blocksPerLineForMcu; j++) {
                        row.push(new Int32Array(64));
                    }
                    blocks.push(row);
                }
                component.blocksPerLine = blocksPerLine;
                component.blocksPerColumn = blocksPerColumn;
                component.blocks = blocks;
            }
        }
        frame.maxH = maxH;
        frame.maxV = maxV;
        frame.mcusPerLine = mcusPerLine;
        frame.mcusPerColumn = mcusPerColumn;
    }
    var jfif = null;
    var adobe = null;
    var frame = undefined;
    var resetInterval = 0;
    var quantizationTables = [];
    var frames = [];
    var huffmanTablesAC = [];
    var huffmanTablesDC = [];
    var fileMarker = readUint16();
    var malformedDataOffset = -1;
    if (fileMarker != 0xFFD8) { // SOI (Start of Image)
        throw new Error('SOI not found');
    }
    fileMarker = readUint16();
    while (fileMarker != 0xFFD9) { // EOI (End of image)
        switch (fileMarker) {
            case 0xFF00: break;
            case 0xFFE0: // APP0 (Application Specific)
            case 0xFFE1: // APP1
            case 0xFFE2: // APP2
            case 0xFFE3: // APP3
            case 0xFFE4: // APP4
            case 0xFFE5: // APP5
            case 0xFFE6: // APP6
            case 0xFFE7: // APP7
            case 0xFFE8: // APP8
            case 0xFFE9: // APP9
            case 0xFFEA: // APP10
            case 0xFFEB: // APP11
            case 0xFFEC: // APP12
            case 0xFFED: // APP13
            case 0xFFEE: // APP14
            case 0xFFEF: // APP15
            case 0xFFFE: { // COM (Comment)
                var appData = readDataBlock();
                if (fileMarker === 0xFFFE) {
                    var comment = '';
                    for (var ii = 0; ii < appData.byteLength; ii++) {
                        comment += String.fromCharCode(appData[ii]);
                    }
                    self.comments.push(comment);
                }
                if (fileMarker === 0xFFE0) {
                    if (appData[0] === 0x4A && appData[1] === 0x46 && appData[2] === 0x49 &&
                        appData[3] === 0x46 && appData[4] === 0) { // 'JFIF\x00'
                        jfif = {
                            version: { major: appData[5], minor: appData[6] },
                            densityUnits: appData[7],
                            xDensity: (appData[8] << 8) | appData[9],
                            yDensity: (appData[10] << 8) | appData[11],
                            thumbWidth: appData[12],
                            thumbHeight: appData[13],
                            thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                        };
                    }
                }
                // TODO APP1 - Exif
                if (fileMarker === 0xFFE1) {
                    if (appData[0] === 0x45 &&
                        appData[1] === 0x78 &&
                        appData[2] === 0x69 &&
                        appData[3] === 0x66 &&
                        appData[4] === 0) { // 'EXIF\x00'
                        self.exifBuffer = appData.subarray(5, appData.length);
                    }
                }
                if (fileMarker === 0xFFEE) {
                    if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6F &&
                        appData[3] === 0x62 && appData[4] === 0x65 && appData[5] === 0) { // 'Adobe\x00'
                        adobe = {
                            version: appData[6],
                            flags0: (appData[7] << 8) | appData[8],
                            flags1: (appData[9] << 8) | appData[10],
                            transformCode: appData[11]
                        };
                    }
                }
                break;
            }
            case 0xFFDB: { // DQT (Define Quantization Tables)
                var quantizationTablesLength = readUint16();
                var quantizationTablesEnd = quantizationTablesLength + offset - 2;
                while (offset < quantizationTablesEnd) {
                    var quantizationTableSpec = data[offset++];
                    requestMemoryAllocation(64 * 4);
                    var tableData = new Int32Array(64);
                    if ((quantizationTableSpec >> 4) === 0) { // 8 bit values
                        for (var j = 0; j < 64; j++) {
                            var z = dctZigZag[j];
                            tableData[z] = data[offset++];
                        }
                    }
                    else if ((quantizationTableSpec >> 4) === 1) { //16 bit
                        for (var j = 0; j < 64; j++) {
                            var z = dctZigZag[j];
                            tableData[z] = readUint16();
                        }
                    }
                    else
                        throw new Error('DQT: invalid table spec');
                    quantizationTables[quantizationTableSpec & 15] = tableData;
                }
                break;
            }
            case 0xFFC0: // SOF0 (Start of Frame, Baseline DCT)
            case 0xFFC1: // SOF1 (Start of Frame, Extended DCT)
            case 0xFFC2: { // SOF2 (Start of Frame, Progressive DCT)
                readUint16(); // skip data length
                frame = {
                    extended: (fileMarker === 0xFFC1),
                    progressive: (fileMarker === 0xFFC2),
                    precision: data[offset++],
                    scanLines: readUint16(),
                    samplesPerLine: readUint16(),
                    components: {},
                    componentsOrder: [],
                    maxH: 0,
                    maxV: 0,
                    mcusPerLine: 0,
                    mcusPerColumn: 0,
                };
                var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
                if (pixelsInFrame > maxResolutionInPixels) {
                    var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
                    throw new Error("maxResolutionInMP limit exceeded by ".concat(exceededAmount, "MP"));
                }
                var componentsCount = data[offset++];
                for (var i = 0; i < componentsCount; i++) {
                    var componentId = data[offset];
                    var h = data[offset + 1] >> 4;
                    var v = data[offset + 1] & 15;
                    var qId = data[offset + 2];
                    frame.componentsOrder.push(componentId);
                    frame.components[componentId] = {
                        h: h,
                        v: v,
                        quantizationIdx: qId,
                        blocksPerColumn: 0,
                        blocksPerLine: 0,
                        blocks: [],
                        pred: 0,
                    };
                    offset += 3;
                }
                prepareComponents(frame);
                frames.push(frame);
                break;
            }
            case 0xFFC4: { // DHT (Define Huffman Tables)
                var huffmanLength = readUint16();
                for (var i = 2; i < huffmanLength;) {
                    var huffmanTableSpec = data[offset++];
                    var codeLengths = new Uint8Array(16);
                    var codeLengthSum = 0;
                    for (var j = 0; j < 16; j++, offset++) {
                        codeLengthSum += (codeLengths[j] = data[offset]);
                    }
                    requestMemoryAllocation(16 + codeLengthSum);
                    var huffmanValues = new Uint8Array(codeLengthSum);
                    for (var j = 0; j < codeLengthSum; j++, offset++) {
                        huffmanValues[j] = data[offset];
                    }
                    i += 17 + codeLengthSum;
                    var index = huffmanTableSpec & 15;
                    var table = (huffmanTableSpec >> 4) === 0 ? huffmanTablesDC : huffmanTablesAC;
                    table[index] = buildHuffmanTable(codeLengths, huffmanValues);
                }
                break;
            }
            case 0xFFDD: // DRI (Define Restart Interval)
                readUint16(); // skip data length
                resetInterval = readUint16();
                break;
            case 0xFFDC: // Number of Lines marker
                readUint16(); // skip data length
                readUint16(); // Ignore this data since it represents the image height
                break;
            case 0xFFDA: { // SOS (Start of Scan)
                readUint16(); // skip data length
                var selectorsCount = data[offset++];
                var components = [];
                for (var i = 0; i < selectorsCount; i++) {
                    var component = frame.components[data[offset++]];
                    var tableSpec = data[offset++];
                    component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                    component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                    components.push(component);
                }
                var spectralStart = data[offset++];
                var spectralEnd = data[offset++];
                var successiveApproximation = data[offset++];
                var processed = decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successiveApproximation >> 4, successiveApproximation & 15);
                offset += processed;
                break;
            }
            case 0xFFFF: // Fill bytes
                if (data[offset] !== 0xFF) { // Avoid skipping a valid marker.
                    offset--;
                }
                break;
            default: {
                if (data[offset - 3] == 0xFF && data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
                    // could be incorrect encoding -- last 0xFF byte of the previous
                    // block was eaten by the encoder
                    offset -= 3;
                    break;
                }
                else if (fileMarker === 0xE0 || fileMarker == 0xE1) {
                    // Recover from malformed APP1 markers popular in some phone models.
                    // See https://github.com/eugeneware/jpeg-js/issues/82
                    if (malformedDataOffset !== -1) {
                        throw new Error("first unknown JPEG marker at offset ".concat(malformedDataOffset.toString(16), ", second unknown JPEG marker ").concat(fileMarker.toString(16), " at offset ").concat((offset - 1).toString(16)));
                    }
                    malformedDataOffset = offset - 1;
                    var nextOffset = readUint16();
                    if (data[offset + nextOffset - 2] === 0xFF) {
                        offset += nextOffset - 2;
                        break;
                    }
                }
                throw new Error('unknown JPEG marker ' + fileMarker.toString(16));
            }
        }
        fileMarker = readUint16();
    }
    if (frames.length != 1)
        throw new Error('only single frame JPEGs supported');
    // set each frame's components quantization table
    for (var i = 0; i < frames.length; i++) {
        var cp = frames[i].components;
        for (var j in cp) { // TODO: don't use `in`
            cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
            delete cp[j].quantizationIdx; // TODO: why ???
        }
    }
    self.width = frame.samplesPerLine;
    self.height = frame.scanLines;
    self.jfif = jfif;
    self.adobe = adobe;
    self.components = [];
    for (var i = 0; i < frame.componentsOrder.length; i++) {
        var component = frame.components[frame.componentsOrder[i]];
        self.components.push({
            lines: buildComponentData(component),
            scaleX: component.h / frame.maxH,
            scaleY: component.v / frame.maxV
        });
    }
    return self;
}
function getData(decoded) {
    var offset = 0;
    var colorTransform = false;
    var width = decoded.width;
    var height = decoded.height;
    var dataLength = width * height * decoded.components.length;
    requestMemoryAllocation(dataLength);
    var data = new Uint8Array(dataLength);
    switch (decoded.components.length) {
        case 1: {
            var component1 = decoded.components[0];
            for (var y = 0; y < height; y++) {
                var component1Line = component1.lines[0 | (y * component1.scaleY)];
                for (var x = 0; x < width; x++) {
                    var Y = component1Line[0 | (x * component1.scaleX)];
                    data[offset++] = Y;
                }
            }
            break;
        }
        case 2: {
            // PDF might compress two component data in custom colorspace
            var component1 = decoded.components[0];
            var component2 = decoded.components[1];
            for (var y = 0; y < height; y++) {
                var component1Line = component1.lines[0 | (y * component1.scaleY)];
                var component2Line = component2.lines[0 | (y * component2.scaleY)];
                for (var x = 0; x < width; x++) {
                    var Y1 = component1Line[0 | (x * component1.scaleX)];
                    data[offset++] = Y1;
                    var Y2 = component2Line[0 | (x * component2.scaleX)];
                    data[offset++] = Y2;
                }
            }
            break;
        }
        case 3: {
            // The default transform for three components is true
            colorTransform = true;
            // The adobe transform marker overrides any previous setting
            if (decoded.adobe && decoded.adobe.transformCode)
                colorTransform = true;
            var component1 = decoded.components[0];
            var component2 = decoded.components[1];
            var component3 = decoded.components[2];
            for (var y = 0; y < height; y++) {
                var component1Line = component1.lines[0 | (y * component1.scaleY)];
                var component2Line = component2.lines[0 | (y * component2.scaleY)];
                var component3Line = component3.lines[0 | (y * component3.scaleY)];
                for (var x = 0; x < width; x++) {
                    var Y = void 0, Cb = void 0, Cr = void 0, R = void 0, G = void 0, B = void 0;
                    if (!colorTransform) {
                        R = component1Line[0 | (x * component1.scaleX)];
                        G = component2Line[0 | (x * component2.scaleX)];
                        B = component3Line[0 | (x * component3.scaleX)];
                    }
                    else {
                        Y = component1Line[0 | (x * component1.scaleX)];
                        Cb = component2Line[0 | (x * component2.scaleX)];
                        Cr = component3Line[0 | (x * component3.scaleX)];
                        R = clampTo8bit(Y + 1.402 * (Cr - 128));
                        G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                        B = clampTo8bit(Y + 1.772 * (Cb - 128));
                    }
                    data[offset++] = R;
                    data[offset++] = G;
                    data[offset++] = B;
                }
            }
            break;
        }
        case 4: {
            if (!decoded.adobe)
                throw new Error('Unsupported color mode (4 components)');
            // The default transform for four components is false
            colorTransform = false;
            // The adobe transform marker overrides any previous setting
            if (decoded.adobe && decoded.adobe.transformCode)
                colorTransform = true;
            var component1 = decoded.components[0];
            var component2 = decoded.components[1];
            var component3 = decoded.components[2];
            var component4 = decoded.components[3];
            for (var y = 0; y < height; y++) {
                var component1Line = component1.lines[0 | (y * component1.scaleY)];
                var component2Line = component2.lines[0 | (y * component2.scaleY)];
                var component3Line = component3.lines[0 | (y * component3.scaleY)];
                var component4Line = component4.lines[0 | (y * component4.scaleY)];
                for (var x = 0; x < width; x++) {
                    var Y = void 0, Cb = void 0, Cr = void 0, K = void 0, C = void 0, M = void 0, Ye = void 0;
                    if (!colorTransform) {
                        C = component1Line[0 | (x * component1.scaleX)];
                        M = component2Line[0 | (x * component2.scaleX)];
                        Ye = component3Line[0 | (x * component3.scaleX)];
                        K = component4Line[0 | (x * component4.scaleX)];
                    }
                    else {
                        Y = component1Line[0 | (x * component1.scaleX)];
                        Cb = component2Line[0 | (x * component2.scaleX)];
                        Cr = component3Line[0 | (x * component3.scaleX)];
                        K = component4Line[0 | (x * component4.scaleX)];
                        C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                        M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                        Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
                    }
                    data[offset++] = 255 - C;
                    data[offset++] = 255 - M;
                    data[offset++] = 255 - Ye;
                    data[offset++] = 255 - K;
                }
            }
            break;
        }
        default:
            throw new Error('Unsupported color mode');
    }
    return data;
}
function decodeJpeg(encoded, createImageData) {
    totalBytesAllocated = 0;
    if (encoded.length === 0)
        throw new Error('Empty jpeg buffer');
    var decoded = parse(encoded);
    requestMemoryAllocation(decoded.width * decoded.height * 4);
    var data = getData(decoded);
    var imageData = createImageData(decoded.width, decoded.height);
    var width = imageData.width;
    var height = imageData.height;
    var imageDataArray = imageData.data;
    var i = 0;
    var j = 0;
    switch (decoded.components.length) {
        case 1:
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var Y = data[i++];
                    imageDataArray[j++] = Y;
                    imageDataArray[j++] = Y;
                    imageDataArray[j++] = Y;
                    imageDataArray[j++] = 255;
                }
            }
            break;
        case 3:
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var R = data[i++];
                    var G = data[i++];
                    var B = data[i++];
                    imageDataArray[j++] = R;
                    imageDataArray[j++] = G;
                    imageDataArray[j++] = B;
                    imageDataArray[j++] = 255;
                }
            }
            break;
        case 4:
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var C = data[i++];
                    var M = data[i++];
                    var Y = data[i++];
                    var K = data[i++];
                    var R = 255 - clampTo8bit(C * (1 - K / 255) + K);
                    var G = 255 - clampTo8bit(M * (1 - K / 255) + K);
                    var B = 255 - clampTo8bit(Y * (1 - K / 255) + K);
                    imageDataArray[j++] = R;
                    imageDataArray[j++] = G;
                    imageDataArray[j++] = B;
                    imageDataArray[j++] = 255;
                }
            }
            break;
        default:
            throw new Error('Unsupported color mode');
    }
    return imageData;
}
exports.decodeJpeg = decodeJpeg;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QyxHQUFHLEdBQUMsQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDZixTQUFTO2FBQ1Y7WUFFRCxVQUFVO1lBQ1YsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNwQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdELElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdELElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXpCLFVBQVU7WUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsT0FBTyxHQUFHLEVBQUUsR0FBRyxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNQLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QixFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRVAsVUFBVTtZQUNWLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QixFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLE9BQU8sR0FBRyxFQUFFLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMvQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsT0FBTyxHQUFHLEVBQUUsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2hELEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsT0FBTyxHQUFHLEVBQUUsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQy9DLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEQsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUVQLFVBQVU7WUFDVixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUNyQixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUNyQixDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1NBQ3RCO1FBRUQseUJBQXlCO1FBQ3pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDMUIsSUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBRWQscUNBQXFDO1lBQ3JDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNuRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDckIsSUFBTSxHQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2xELENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBQyxDQUFDO2dCQUNuQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFDLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBQyxDQUFDO2dCQUNuQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFDLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUMsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBQyxDQUFDO2dCQUNuQixTQUFTO2FBQ1Y7WUFFRCxVQUFVO1lBQ1YsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xELElBQUksRUFBRSxHQUFHLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsRCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUN4QixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUN4QixJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3ZFLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdkUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDeEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFFeEIsVUFBVTtZQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0IsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNQLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDL0MsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLE9BQU8sR0FBRyxFQUFFLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoRCxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkIsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNQLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFUCxVQUFVO1lBQ1YsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkIsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNQLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsT0FBTyxHQUFHLEVBQUUsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQy9DLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEQsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNQLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDL0MsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLE9BQU8sR0FBRyxFQUFFLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoRCxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRVAsVUFBVTtZQUNWLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDekIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUN6QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDekIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUN6QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDekIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztTQUMxQjtRQUVELDRCQUE0QjtRQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQzNCLElBQU0sTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1NBQzdEO0lBQ0gsQ0FBQztJQUVELHVCQUF1QixDQUFDLGNBQWMsR0FBRyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFOUQsS0FBSyxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsUUFBUSxHQUFHLGVBQWUsRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUM3RCxJQUFNLFFBQVEsR0FBRyxRQUFRLElBQUksQ0FBQyxDQUFDO1FBRS9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ3hCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUU3QyxLQUFLLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRSxRQUFRLEdBQUcsYUFBYSxFQUFFLFFBQVEsRUFBRSxFQUFFO1lBQzNELGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRS9ELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLElBQU0sTUFBTSxHQUFHLFFBQVEsSUFBSSxDQUFDLENBQUM7WUFDN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUIsSUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQ3hCLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7YUFDbEM7U0FDRjtLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsQ0FBUztJQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUVELFNBQVMsS0FBSyxDQUFDLElBQWdCO0lBQzdCLElBQU0sSUFBSSxHQUFZO1FBQ3BCLEtBQUssRUFBRSxDQUFDO1FBQ1IsTUFBTSxFQUFFLENBQUM7UUFDVCxRQUFRLEVBQUUsRUFBRTtRQUNaLEtBQUssRUFBRSxTQUFTO1FBQ2hCLFVBQVUsRUFBRSxFQUFFO1FBQ2QsVUFBVSxFQUFFLFNBQVM7UUFDckIsSUFBSSxFQUFFLFNBQVM7S0FDaEIsQ0FBQztJQUVGLElBQU0scUJBQXFCLEdBQUcsaUJBQWlCLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztJQUM5RCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFZixTQUFTLFVBQVU7UUFDakIsSUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNyRCxNQUFNLElBQUksQ0FBQyxDQUFDO1FBQ1osT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxhQUFhO1FBQ3BCLElBQU0sTUFBTSxHQUFHLFVBQVUsRUFBRSxDQUFDO1FBQzVCLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekQsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDdkIsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxLQUFZO1FBQ3JDLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBRXZCLEtBQUssSUFBSSxXQUFXLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUN4QyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUNoRCxJQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQztvQkFBRSxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUM7b0JBQUUsSUFBSSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7YUFDNUM7U0FDRjtRQUVELElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDL0QsSUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUU1RCxLQUFLLElBQUksV0FBVyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDeEMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDaEQsSUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDaEQsSUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDMUYsSUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDdkYsSUFBTSxtQkFBbUIsR0FBRyxXQUFXLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDdEQsSUFBTSxxQkFBcUIsR0FBRyxhQUFhLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDMUQsSUFBTSxnQkFBZ0IsR0FBRyxxQkFBcUIsR0FBRyxtQkFBbUIsQ0FBQztnQkFDckUsSUFBTSxNQUFNLEdBQW1CLEVBQUUsQ0FBQztnQkFFbEMsK0RBQStEO2dCQUMvRCx1QkFBdUIsQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFFaEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHFCQUFxQixFQUFFLENBQUMsRUFBRSxFQUFFO29CQUM5QyxJQUFNLEdBQUcsR0FBaUIsRUFBRSxDQUFDO29CQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLEVBQUU7d0JBQzVDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDOUI7b0JBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDbEI7Z0JBQ0QsU0FBUyxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7Z0JBQ3hDLFNBQVMsQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO2dCQUM1QyxTQUFTLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQzthQUMzQjtTQUNGO1FBRUQsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsS0FBSyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDaEMsS0FBSyxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7SUFDdEMsQ0FBQztJQUVELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztJQUNoQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDakIsSUFBSSxLQUFLLEdBQXNCLFNBQVMsQ0FBQztJQUN6QyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxrQkFBa0IsR0FBRyxFQUFFLENBQUM7SUFDNUIsSUFBSSxNQUFNLEdBQVksRUFBRSxDQUFDO0lBQ3pCLElBQUksZUFBZSxHQUE4QixFQUFFLENBQUM7SUFDcEQsSUFBSSxlQUFlLEdBQThCLEVBQUUsQ0FBQztJQUNwRCxJQUFJLFVBQVUsR0FBRyxVQUFVLEVBQUUsQ0FBQztJQUM5QixJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTdCLElBQUksVUFBVSxJQUFJLE1BQU0sRUFBRSxFQUFFLHVCQUF1QjtRQUNqRCxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0tBQ2xDO0lBRUQsVUFBVSxHQUFHLFVBQVUsRUFBRSxDQUFDO0lBQzFCLE9BQU8sVUFBVSxJQUFJLE1BQU0sRUFBRSxFQUFFLHFCQUFxQjtRQUNsRCxRQUFRLFVBQVUsRUFBRTtZQUNsQixLQUFLLE1BQU0sQ0FBQyxDQUFDLE1BQU07WUFDbkIsS0FBSyxNQUFNLENBQUMsQ0FBQyw4QkFBOEI7WUFDM0MsS0FBSyxNQUFNLENBQUMsQ0FBQyxPQUFPO1lBQ3BCLEtBQUssTUFBTSxDQUFDLENBQUMsT0FBTztZQUNwQixLQUFLLE1BQU0sQ0FBQyxDQUFDLE9BQU87WUFDcEIsS0FBSyxNQUFNLENBQUMsQ0FBQyxPQUFPO1lBQ3BCLEtBQUssTUFBTSxDQUFDLENBQUMsT0FBTztZQUNwQixLQUFLLE1BQU0sQ0FBQyxDQUFDLE9BQU87WUFDcEIsS0FBSyxNQUFNLENBQUMsQ0FBQyxPQUFPO1lBQ3BCLEtBQUssTUFBTSxDQUFDLENBQUMsT0FBTztZQUNwQixLQUFLLE1BQU0sQ0FBQyxDQUFDLE9BQU87WUFDcEIsS0FBSyxNQUFNLENBQUMsQ0FBQyxRQUFRO1lBQ3JCLEtBQUssTUFBTSxDQUFDLENBQUMsUUFBUTtZQUNyQixLQUFLLE1BQU0sQ0FBQyxDQUFDLFFBQVE7WUFDckIsS0FBSyxNQUFNLENBQUMsQ0FBQyxRQUFRO1lBQ3JCLEtBQUssTUFBTSxDQUFDLENBQUMsUUFBUTtZQUNyQixLQUFLLE1BQU0sQ0FBQyxDQUFDLFFBQVE7WUFDckIsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLGdCQUFnQjtnQkFDN0IsSUFBTSxPQUFPLEdBQUcsYUFBYSxFQUFFLENBQUM7Z0JBRWhDLElBQUksVUFBVSxLQUFLLE1BQU0sRUFBRTtvQkFDekIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNqQixLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRTt3QkFDOUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQzdDO29CQUNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUM3QjtnQkFFRCxJQUFJLFVBQVUsS0FBSyxNQUFNLEVBQUU7b0JBQ3pCLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJO3dCQUNuRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxhQUFhO3dCQUN4RCxJQUFJLEdBQUc7NEJBQ0wsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUNqRCxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzs0QkFDeEIsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ3hDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDOzRCQUMxQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQzs0QkFDdkIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7NEJBQ3hCLFNBQVMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7eUJBQ3BFLENBQUM7cUJBQ0g7aUJBQ0Y7Z0JBQ0QsbUJBQW1CO2dCQUNuQixJQUFJLFVBQVUsS0FBSyxNQUFNLEVBQUU7b0JBQ3pCLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUk7d0JBQ3JCLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJO3dCQUNuQixPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSTt3QkFDbkIsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUk7d0JBQ25CLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxhQUFhO3dCQUNqQyxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztxQkFDdkQ7aUJBQ0Y7Z0JBRUQsSUFBSSxVQUFVLEtBQUssTUFBTSxFQUFFO29CQUN6QixJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSTt3QkFDbkUsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxjQUFjO3dCQUNoRixLQUFLLEdBQUc7NEJBQ04sT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ25CLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDOzRCQUN0QyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQzs0QkFDdkMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7eUJBQzNCLENBQUM7cUJBQ0g7aUJBQ0Y7Z0JBQ0QsTUFBTTthQUNQO1lBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLG1DQUFtQztnQkFDaEQsSUFBTSx3QkFBd0IsR0FBRyxVQUFVLEVBQUUsQ0FBQztnQkFDOUMsSUFBTSxxQkFBcUIsR0FBRyx3QkFBd0IsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUNwRSxPQUFPLE1BQU0sR0FBRyxxQkFBcUIsRUFBRTtvQkFDckMsSUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztvQkFDN0MsdUJBQXVCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNoQyxJQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDckMsSUFBSSxDQUFDLHFCQUFxQixJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLGVBQWU7d0JBQ3ZELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7NEJBQzNCLElBQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdkIsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO3lCQUMvQjtxQkFDRjt5QkFBTSxJQUFJLENBQUMscUJBQXFCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsUUFBUTt3QkFDdkQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTs0QkFDM0IsSUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUN2QixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUM7eUJBQzdCO3FCQUNGOzt3QkFDQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7b0JBQzdDLGtCQUFrQixDQUFDLHFCQUFxQixHQUFHLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztpQkFDNUQ7Z0JBQ0QsTUFBTTthQUNQO1lBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQyxzQ0FBc0M7WUFDbkQsS0FBSyxNQUFNLENBQUMsQ0FBQyxzQ0FBc0M7WUFDbkQsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLHlDQUF5QztnQkFDdEQsVUFBVSxFQUFFLENBQUMsQ0FBQyxtQkFBbUI7Z0JBQ2pDLEtBQUssR0FBRztvQkFDTixRQUFRLEVBQUUsQ0FBQyxVQUFVLEtBQUssTUFBTSxDQUFDO29CQUNqQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLEtBQUssTUFBTSxDQUFDO29CQUNwQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUN6QixTQUFTLEVBQUUsVUFBVSxFQUFFO29CQUN2QixjQUFjLEVBQUUsVUFBVSxFQUFFO29CQUM1QixVQUFVLEVBQUUsRUFBRTtvQkFDZCxlQUFlLEVBQUUsRUFBRTtvQkFDbkIsSUFBSSxFQUFFLENBQUM7b0JBQ1AsSUFBSSxFQUFFLENBQUM7b0JBQ1AsV0FBVyxFQUFFLENBQUM7b0JBQ2QsYUFBYSxFQUFFLENBQUM7aUJBQ2pCLENBQUM7Z0JBRUYsSUFBTSxhQUFhLEdBQUcsS0FBTSxDQUFDLFNBQVMsR0FBRyxLQUFNLENBQUMsY0FBYyxDQUFDO2dCQUMvRCxJQUFJLGFBQWEsR0FBRyxxQkFBcUIsRUFBRTtvQkFDekMsSUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLGFBQWEsR0FBRyxxQkFBcUIsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO29CQUNoRixNQUFNLElBQUksS0FBSyxDQUFDLDhDQUF1QyxjQUFjLE9BQUksQ0FBQyxDQUFDO2lCQUM1RTtnQkFFRCxJQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFFdkMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGVBQWUsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDeEMsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNqQyxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDaEMsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ2hDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzdCLEtBQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUN6QyxLQUFNLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHO3dCQUMvQixDQUFDLEVBQUUsQ0FBQzt3QkFDSixDQUFDLEVBQUUsQ0FBQzt3QkFDSixlQUFlLEVBQUUsR0FBRzt3QkFDcEIsZUFBZSxFQUFFLENBQUM7d0JBQ2xCLGFBQWEsRUFBRSxDQUFDO3dCQUNoQixNQUFNLEVBQUUsRUFBRTt3QkFDVixJQUFJLEVBQUUsQ0FBQztxQkFDUixDQUFDO29CQUNGLE1BQU0sSUFBSSxDQUFDLENBQUM7aUJBQ2I7Z0JBQ0QsaUJBQWlCLENBQUMsS0FBTSxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLE1BQU07YUFDUDtZQUNELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBQyw4QkFBOEI7Z0JBQzFDLElBQU0sYUFBYSxHQUFHLFVBQVUsRUFBRSxDQUFDO2dCQUVuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxHQUFHO29CQUNsQyxJQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxJQUFNLFdBQVcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO29CQUV0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFO3dCQUNyQyxhQUFhLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7cUJBQ2xEO29CQUVELHVCQUF1QixDQUFDLEVBQUUsR0FBRyxhQUFhLENBQUMsQ0FBQztvQkFDNUMsSUFBTSxhQUFhLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBRXBELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUU7d0JBQ2hELGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ2pDO29CQUVELENBQUMsSUFBSSxFQUFFLEdBQUcsYUFBYSxDQUFDO29CQUV4QixJQUFNLEtBQUssR0FBRyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7b0JBQ3BDLElBQU0sS0FBSyxHQUFHLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztvQkFDaEYsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztpQkFDOUQ7Z0JBQ0QsTUFBTTthQUNQO1lBQ0QsS0FBSyxNQUFNLEVBQUUsZ0NBQWdDO2dCQUMzQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQjtnQkFDakMsYUFBYSxHQUFHLFVBQVUsRUFBRSxDQUFDO2dCQUM3QixNQUFNO1lBQ1IsS0FBSyxNQUFNLEVBQUUseUJBQXlCO2dCQUNwQyxVQUFVLEVBQUUsQ0FBQSxDQUFDLG1CQUFtQjtnQkFDaEMsVUFBVSxFQUFFLENBQUEsQ0FBQyx3REFBd0Q7Z0JBQ3JFLE1BQU07WUFDUixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsc0JBQXNCO2dCQUNuQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQjtnQkFDakMsSUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3RDLElBQU0sVUFBVSxHQUFnQixFQUFFLENBQUM7Z0JBQ25DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3ZDLElBQU0sU0FBUyxHQUFHLEtBQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDcEQsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7b0JBQ2pDLFNBQVMsQ0FBQyxjQUFjLEdBQUcsZUFBZSxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDM0QsU0FBUyxDQUFDLGNBQWMsR0FBRyxlQUFlLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUMzRCxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUM1QjtnQkFDRCxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDckMsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ25DLElBQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQy9DLElBQU0sU0FBUyxHQUFHLFVBQVUsQ0FDMUIsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFNLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUMzRSx1QkFBdUIsSUFBSSxDQUFDLEVBQUUsdUJBQXVCLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQzlELE1BQU0sSUFBSSxTQUFTLENBQUM7Z0JBQ3BCLE1BQU07YUFDUDtZQUNELEtBQUssTUFBTSxFQUFFLGFBQWE7Z0JBQ3hCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRSxFQUFFLGlDQUFpQztvQkFDNUQsTUFBTSxFQUFFLENBQUM7aUJBQ1Y7Z0JBQ0QsTUFBTTtZQUNSLE9BQU8sQ0FBQyxDQUFDO2dCQUNQLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUU7b0JBQ3BGLGdFQUFnRTtvQkFDaEUsaUNBQWlDO29CQUNqQyxNQUFNLElBQUksQ0FBQyxDQUFDO29CQUNaLE1BQU07aUJBQ1A7cUJBQU0sSUFBSSxVQUFVLEtBQUssSUFBSSxJQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7b0JBQ3BELG9FQUFvRTtvQkFDcEUsc0RBQXNEO29CQUN0RCxJQUFJLG1CQUFtQixLQUFLLENBQUMsQ0FBQyxFQUFFO3dCQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLDhDQUF1QyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLDBDQUFnQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyx3QkFBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQyxDQUFDO3FCQUMxTDtvQkFDRCxtQkFBbUIsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUNqQyxJQUFNLFVBQVUsR0FBRyxVQUFVLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7d0JBQzFDLE1BQU0sSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO3dCQUN6QixNQUFNO3FCQUNQO2lCQUNGO2dCQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ25FO1NBQ0Y7UUFFRCxVQUFVLEdBQUcsVUFBVSxFQUFFLENBQUM7S0FDM0I7SUFFRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQztJQUU3RSxpREFBaUQ7SUFDakQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdEMsSUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUNoQyxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLHVCQUF1QjtZQUN6QyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLEdBQUcsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWdCLENBQUMsQ0FBQztZQUNyRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxnQkFBZ0I7U0FDL0M7S0FDRjtJQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBTSxDQUFDLGNBQWMsQ0FBQztJQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQU0sQ0FBQyxTQUFTLENBQUM7SUFDL0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7SUFFckIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3RELElBQU0sU0FBUyxHQUFHLEtBQU0sQ0FBQyxVQUFVLENBQUMsS0FBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxTQUFTLENBQUM7WUFDcEMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsS0FBTSxDQUFDLElBQUk7WUFDakMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsS0FBTSxDQUFDLElBQUk7U0FDbEMsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxPQUFnQjtJQUMvQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDZixJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFFM0IsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztJQUM1QixJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQzlCLElBQU0sVUFBVSxHQUFHLEtBQUssR0FBRyxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7SUFDOUQsdUJBQXVCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDcEMsSUFBTSxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFeEMsUUFBUSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtRQUNqQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ04sSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMvQixJQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFFckUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDOUIsSUFBTSxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDdEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNwQjthQUNGO1lBQ0QsTUFBTTtTQUNQO1FBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNOLDZEQUE2RDtZQUM3RCxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0IsSUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3JFLElBQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUVyRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUM5QixJQUFNLEVBQUUsR0FBRyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ3BCLElBQU0sRUFBRSxHQUFHLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ3ZELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztpQkFDckI7YUFDRjtZQUNELE1BQU07U0FDUDtRQUNELEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDTixxREFBcUQ7WUFDckQsY0FBYyxHQUFHLElBQUksQ0FBQztZQUN0Qiw0REFBNEQ7WUFDNUQsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYTtnQkFBRSxjQUFjLEdBQUcsSUFBSSxDQUFDO1lBRXhFLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQy9CLElBQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxJQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDckUsSUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBRXJFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzlCLElBQUksQ0FBQyxTQUFBLEVBQUUsRUFBRSxTQUFBLEVBQUUsRUFBRSxTQUFBLEVBQUUsQ0FBQyxTQUFBLEVBQUUsQ0FBQyxTQUFBLEVBQUUsQ0FBQyxTQUFBLENBQUM7b0JBRXZCLElBQUksQ0FBQyxjQUFjLEVBQUU7d0JBQ25CLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDaEQsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7cUJBQ2pEO3lCQUFNO3dCQUNMLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxFQUFFLEdBQUcsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDakQsRUFBRSxHQUFHLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBRWpELENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUN4QyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ3RFLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO3FCQUN6QztvQkFFRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ25CLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNwQjthQUNGO1lBQ0QsTUFBTTtTQUNQO1FBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSztnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7WUFDN0UscURBQXFEO1lBQ3JELGNBQWMsR0FBRyxLQUFLLENBQUM7WUFDdkIsNERBQTREO1lBQzVELElBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWE7Z0JBQUUsY0FBYyxHQUFHLElBQUksQ0FBQztZQUV4RSxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQy9CLElBQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxJQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDckUsSUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3JFLElBQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUVyRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUM5QixJQUFJLENBQUMsU0FBQSxFQUFFLEVBQUUsU0FBQSxFQUFFLEVBQUUsU0FBQSxFQUFFLENBQUMsU0FBQSxFQUFFLENBQUMsU0FBQSxFQUFFLENBQUMsU0FBQSxFQUFFLEVBQUUsU0FBQSxDQUFDO29CQUUzQixJQUFJLENBQUMsY0FBYyxFQUFFO3dCQUNuQixDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDaEQsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBQ2hELEVBQUUsR0FBRyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNqRCxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztxQkFDakQ7eUJBQU07d0JBQ0wsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBQ2hELEVBQUUsR0FBRyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNqRCxFQUFFLEdBQUcsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDakQsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBRWhELENBQUMsR0FBRyxHQUFHLEdBQUcsV0FBVyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDOUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDNUUsRUFBRSxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO3FCQUNoRDtvQkFDRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO29CQUN6QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO29CQUN6QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO29CQUMxQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO2lCQUMxQjthQUNGO1lBQ0QsTUFBTTtTQUNQO1FBQ0Q7WUFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7S0FDN0M7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFnQixVQUFVLENBQUMsT0FBbUIsRUFBRSxlQUE2RDtJQUMzRyxtQkFBbUIsR0FBRyxDQUFDLENBQUM7SUFFeEIsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUM7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFFL0QsSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUU1RCxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFOUIsSUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2pFLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7SUFDOUIsSUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztJQUNoQyxJQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0lBRXRDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVWLFFBQVEsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7UUFDakMsS0FBSyxDQUFDO1lBQ0osS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDOUIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBRXBCLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDeEIsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN4QixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3hCLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQztpQkFDM0I7YUFDRjtZQUNELE1BQU07UUFDUixLQUFLLENBQUM7WUFDSixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMvQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUM5QixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3BCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUVwQixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3hCLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDeEIsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN4QixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUM7aUJBQzNCO2FBQ0Y7WUFDRCxNQUFNO1FBQ1IsS0FBSyxDQUFDO1lBQ0osS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDOUIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3BCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNwQixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBRXBCLElBQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDbkQsSUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNuRCxJQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBRW5ELGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDeEIsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN4QixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3hCLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQztpQkFDM0I7YUFDRjtZQUNELE1BQU07UUFDUjtZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztLQUM3QztJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFyRUQsZ0NBcUVDIiwiZmlsZSI6ImpwZWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vanBlZy1qcy9qcGVnLWpzXHJcbi8qXHJcbiAgIENvcHlyaWdodCAyMDExIG5vdG1hc3RlcnlldFxyXG5cclxuICAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuXHJcbiAgICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuXHJcbiAgIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuKi9cclxuXHJcbmludGVyZmFjZSBEZWNvZGVkQ29tcG9uZW50IHtcclxuICBsaW5lczogVWludDhBcnJheVtdO1xyXG4gIHNjYWxlWDogbnVtYmVyO1xyXG4gIHNjYWxlWTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRGVjb2RlZCB7XHJcbiAgd2lkdGg6IG51bWJlcjtcclxuICBoZWlnaHQ6IG51bWJlcjtcclxuICBjb21tZW50czogc3RyaW5nW107XHJcbiAgZXhpZkJ1ZmZlcjogVWludDhBcnJheSB8IHVuZGVmaW5lZDtcclxuICBqZmlmOiBhbnk7XHJcbiAgYWRvYmU6IGFueTtcclxuICBjb21wb25lbnRzOiBEZWNvZGVkQ29tcG9uZW50W107XHJcbn1cclxuXHJcbmludGVyZmFjZSBDb21wb25lbnQge1xyXG4gIGg6IG51bWJlcjtcclxuICB2OiBudW1iZXI7XHJcbiAgYmxvY2tzUGVyTGluZTogbnVtYmVyO1xyXG4gIGJsb2Nrc1BlckNvbHVtbjogbnVtYmVyO1xyXG4gIGJsb2NrczogSW50MzJBcnJheVtdW107XHJcbiAgcHJlZDogbnVtYmVyOyAvLyA/Pz9cclxuICBxdWFudGl6YXRpb25JZHg/OiBudW1iZXI7XHJcbiAgcXVhbnRpemF0aW9uVGFibGU/OiBJbnQzMkFycmF5O1xyXG4gIGh1ZmZtYW5UYWJsZURDPzogbnVtYmVyW10gfCBudW1iZXJbXVtdO1xyXG4gIGh1ZmZtYW5UYWJsZUFDPzogbnVtYmVyW10gfCBudW1iZXJbXVtdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRnJhbWUge1xyXG4gIGV4dGVuZGVkOiBib29sZWFuO1xyXG4gIHByb2dyZXNzaXZlOiBib29sZWFuO1xyXG4gIHByZWNpc2lvbjogbnVtYmVyO1xyXG4gIHNjYW5MaW5lczogbnVtYmVyO1xyXG4gIHNhbXBsZXNQZXJMaW5lOiBudW1iZXI7XHJcbiAgY29tcG9uZW50czogeyBba2V5OiBudW1iZXJdOiBDb21wb25lbnQ7IH07XHJcbiAgY29tcG9uZW50c09yZGVyOiBudW1iZXJbXTtcclxuICBtYXhIOiBudW1iZXI7XHJcbiAgbWF4VjogbnVtYmVyO1xyXG4gIG1jdXNQZXJMaW5lOiBudW1iZXI7XHJcbiAgbWN1c1BlckNvbHVtbjogbnVtYmVyO1xyXG59XHJcblxyXG5jb25zdCBkY3RaaWdaYWcgPSBuZXcgSW50MzJBcnJheShbXHJcbiAgMCxcclxuICAxLCA4LFxyXG4gIDE2LCA5LCAyLFxyXG4gIDMsIDEwLCAxNywgMjQsXHJcbiAgMzIsIDI1LCAxOCwgMTEsIDQsXHJcbiAgNSwgMTIsIDE5LCAyNiwgMzMsIDQwLFxyXG4gIDQ4LCA0MSwgMzQsIDI3LCAyMCwgMTMsIDYsXHJcbiAgNywgMTQsIDIxLCAyOCwgMzUsIDQyLCA0OSwgNTYsXHJcbiAgNTcsIDUwLCA0MywgMzYsIDI5LCAyMiwgMTUsXHJcbiAgMjMsIDMwLCAzNywgNDQsIDUxLCA1OCxcclxuICA1OSwgNTIsIDQ1LCAzOCwgMzEsXHJcbiAgMzksIDQ2LCA1MywgNjAsXHJcbiAgNjEsIDU0LCA0NyxcclxuICA1NSwgNjIsXHJcbiAgNjNcclxuXSk7XHJcbmNvbnN0IGRjdENvczEgPSA0MDE3OyAvLyBjb3MocGkvMTYpXHJcbmNvbnN0IGRjdFNpbjEgPSA3OTk7IC8vIHNpbihwaS8xNilcclxuY29uc3QgZGN0Q29zMyA9IDM0MDY7IC8vIGNvcygzKnBpLzE2KVxyXG5jb25zdCBkY3RTaW4zID0gMjI3NjsgLy8gc2luKDMqcGkvMTYpXHJcbmNvbnN0IGRjdENvczYgPSAxNTY3OyAvLyBjb3MoNipwaS8xNilcclxuY29uc3QgZGN0U2luNiA9IDM3ODQ7IC8vIHNpbig2KnBpLzE2KVxyXG5jb25zdCBkY3RTcXJ0MiA9IDU3OTM7IC8vIHNxcnQoMilcclxuY29uc3QgZGN0U3FydDFkMiA9IDI4OTY7IC8vIHNxcnQoMikgLyAyXHJcblxyXG5jb25zdCBtYXhSZXNvbHV0aW9uSW5NUCA9IDEwMDsgLy8gRG9uJ3QgZGVjb2RlIG1vcmUgdGhhbiAxMDAgbWVnYXBpeGVsc1xyXG5jb25zdCBtYXhNZW1vcnlVc2FnZUJ5dGVzID0gNjQgKiAxMDI0ICogMTAyNDsgLy8gRG9uJ3QgZGVjb2RlIGlmIG1lbW9yeSBmb290cHJpbnQgaXMgbW9yZSB0aGFuIDY0TUJcclxubGV0IHRvdGFsQnl0ZXNBbGxvY2F0ZWQgPSAwOyAvLyBhdm9pZCB1bmV4cGVjdGVkIE9PTXMgZnJvbSB1bnRydXN0ZWQgY29udGVudC5cclxuXHJcbmZ1bmN0aW9uIHJlcXVlc3RNZW1vcnlBbGxvY2F0aW9uKGluY3JlYXNlQW1vdW50OiBudW1iZXIpIHtcclxuICBjb25zdCB0b3RhbE1lbW9yeUltcGFjdEJ5dGVzID0gdG90YWxCeXRlc0FsbG9jYXRlZCArIGluY3JlYXNlQW1vdW50O1xyXG4gIGlmICh0b3RhbE1lbW9yeUltcGFjdEJ5dGVzID4gbWF4TWVtb3J5VXNhZ2VCeXRlcykge1xyXG4gICAgY29uc3QgZXhjZWVkZWRBbW91bnQgPSBNYXRoLmNlaWwoKHRvdGFsTWVtb3J5SW1wYWN0Qnl0ZXMgLSBtYXhNZW1vcnlVc2FnZUJ5dGVzKSAvIDEwMjQgLyAxMDI0KTtcclxuICAgIHRocm93IG5ldyBFcnJvcihgTWF4IG1lbW9yeSBsaW1pdCBleGNlZWRlZCBieSBhdCBsZWFzdCAke2V4Y2VlZGVkQW1vdW50fU1CYCk7XHJcbiAgfVxyXG5cclxuICB0b3RhbEJ5dGVzQWxsb2NhdGVkID0gdG90YWxNZW1vcnlJbXBhY3RCeXRlcztcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRIdWZmbWFuVGFibGUoY29kZUxlbmd0aHM6IFVpbnQ4QXJyYXksIHZhbHVlczogVWludDhBcnJheSkge1xyXG4gIGxldCBsZW5ndGggPSAxNjtcclxuXHJcbiAgd2hpbGUgKGxlbmd0aCA+IDAgJiYgIWNvZGVMZW5ndGhzW2xlbmd0aCAtIDFdKSBsZW5ndGgtLTtcclxuXHJcbiAgaW50ZXJmYWNlIENvZGUge1xyXG4gICAgY2hpbGRyZW46IG51bWJlcltdIHwgbnVtYmVyW11bXTtcclxuICAgIGluZGV4OiBudW1iZXI7XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb2RlOiBDb2RlW10gPSBbeyBjaGlsZHJlbjogW10sIGluZGV4OiAwIH1dO1xyXG4gIGxldCBrID0gMDtcclxuICBsZXQgcCA9IGNvZGVbMF07XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29kZUxlbmd0aHNbaV07IGorKykge1xyXG4gICAgICBwID0gY29kZS5wb3AoKSE7XHJcbiAgICAgIHAuY2hpbGRyZW5bcC5pbmRleF0gPSB2YWx1ZXNba107XHJcbiAgICAgIHdoaWxlIChwLmluZGV4ID4gMCkge1xyXG4gICAgICAgIGlmIChjb2RlLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgcmVjcmVhdGUgSHVmZm1hbiBUYWJsZScpO1xyXG4gICAgICAgIHAgPSBjb2RlLnBvcCgpITtcclxuICAgICAgfVxyXG4gICAgICBwLmluZGV4Kys7XHJcbiAgICAgIGNvZGUucHVzaChwKTtcclxuICAgICAgd2hpbGUgKGNvZGUubGVuZ3RoIDw9IGkpIHtcclxuICAgICAgICBjb25zdCBxOiBDb2RlID0geyBjaGlsZHJlbjogW10sIGluZGV4OiAwIH07XHJcbiAgICAgICAgY29kZS5wdXNoKHEpO1xyXG4gICAgICAgIHAuY2hpbGRyZW5bcC5pbmRleF0gPSBxLmNoaWxkcmVuIGFzIG51bWJlcltdO1xyXG4gICAgICAgIHAgPSBxO1xyXG4gICAgICB9XHJcbiAgICAgIGsrKztcclxuICAgIH1cclxuICAgIGlmIChpICsgMSA8IGxlbmd0aCkge1xyXG4gICAgICAvLyBwIGhlcmUgcG9pbnRzIHRvIGxhc3QgY29kZVxyXG4gICAgICBjb25zdCBxOiBDb2RlID0geyBjaGlsZHJlbjogW10sIGluZGV4OiAwIH07XHJcbiAgICAgIGNvZGUucHVzaChxKTtcclxuICAgICAgcC5jaGlsZHJlbltwLmluZGV4XSA9IHEuY2hpbGRyZW4gYXMgbnVtYmVyW107XHJcbiAgICAgIHAgPSBxO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGNvZGVbMF0uY2hpbGRyZW47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlY29kZVNjYW4oXHJcbiAgZGF0YTogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIsIGZyYW1lOiBGcmFtZSwgY29tcG9uZW50czogQ29tcG9uZW50W10sIHJlc2V0SW50ZXJ2YWw6IG51bWJlcixcclxuICBzcGVjdHJhbFN0YXJ0OiBudW1iZXIsIHNwZWN0cmFsRW5kOiBudW1iZXIsIHN1Y2Nlc3NpdmVQcmV2OiBudW1iZXIsIHN1Y2Nlc3NpdmU6IG51bWJlclxyXG4pIHtcclxuICBjb25zdCBtY3VzUGVyTGluZSA9IGZyYW1lLm1jdXNQZXJMaW5lO1xyXG4gIGNvbnN0IHByb2dyZXNzaXZlID0gZnJhbWUucHJvZ3Jlc3NpdmU7XHJcbiAgY29uc3Qgc3RhcnRPZmZzZXQgPSBvZmZzZXQ7XHJcbiAgbGV0IGJpdHNEYXRhID0gMDtcclxuICBsZXQgYml0c0NvdW50ID0gMDtcclxuXHJcbiAgZnVuY3Rpb24gcmVhZEJpdCgpIHtcclxuICAgIGlmIChiaXRzQ291bnQgPiAwKSB7XHJcbiAgICAgIGJpdHNDb3VudC0tO1xyXG4gICAgICByZXR1cm4gKGJpdHNEYXRhID4+IGJpdHNDb3VudCkgJiAxO1xyXG4gICAgfVxyXG5cclxuICAgIGJpdHNEYXRhID0gZGF0YVtvZmZzZXQrK107XHJcblxyXG4gICAgaWYgKGJpdHNEYXRhID09IDB4RkYpIHtcclxuICAgICAgY29uc3QgbmV4dEJ5dGUgPSBkYXRhW29mZnNldCsrXTtcclxuICAgICAgaWYgKG5leHRCeXRlKSB0aHJvdyBuZXcgRXJyb3IoYHVuZXhwZWN0ZWQgbWFya2VyOiAkeygoYml0c0RhdGEgPDwgOCkgfCBuZXh0Qnl0ZSkudG9TdHJpbmcoMTYpfWApO1xyXG4gICAgICAvLyB1bnN0dWZmIDBcclxuICAgIH1cclxuXHJcbiAgICBiaXRzQ291bnQgPSA3O1xyXG4gICAgcmV0dXJuIGJpdHNEYXRhID4+PiA3O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZGVjb2RlSHVmZm1hbih0cmVlOiBudW1iZXJbXSB8IG51bWJlcltdW10pIHtcclxuICAgIGxldCBub2RlOiBudW1iZXIgfCBudW1iZXJbXSB8IG51bWJlcltdW10gPSB0cmVlO1xyXG5cclxuICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgIG5vZGUgPSBub2RlW3JlYWRCaXQoKV07XHJcbiAgICAgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ251bWJlcicpIHJldHVybiBub2RlO1xyXG4gICAgICBpZiAobm9kZSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgaHVmZm1hbiBzZXF1ZW5jZScpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcmVjZWl2ZShsZW5ndGg6IG51bWJlcikge1xyXG4gICAgbGV0IG4gPSAwO1xyXG4gICAgd2hpbGUgKGxlbmd0aCA+IDApIHtcclxuICAgICAgbiA9IChuIDw8IDEpIHwgcmVhZEJpdCgpO1xyXG4gICAgICBsZW5ndGgtLTtcclxuICAgIH1cclxuICAgIHJldHVybiBuO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcmVjZWl2ZUFuZEV4dGVuZChsZW5ndGg6IG51bWJlcikge1xyXG4gICAgbGV0IG4gPSByZWNlaXZlKGxlbmd0aCk7XHJcbiAgICBpZiAobiA+PSAxIDw8IChsZW5ndGggLSAxKSkgcmV0dXJuIG47XHJcbiAgICByZXR1cm4gbiArICgtMSA8PCBsZW5ndGgpICsgMTtcclxuICB9XHJcblxyXG4gIHR5cGUgRGVjb2RlRm4gPSAoY29tcG9uZW50OiBDb21wb25lbnQsIHp6OiBJbnQzMkFycmF5KSA9PiB2b2lkO1xyXG5cclxuICBmdW5jdGlvbiBkZWNvZGVCYXNlbGluZShjb21wb25lbnQ6IENvbXBvbmVudCwgeno6IEludDMyQXJyYXkpIHtcclxuICAgIGNvbnN0IHQgPSBkZWNvZGVIdWZmbWFuKGNvbXBvbmVudC5odWZmbWFuVGFibGVEQyEpO1xyXG4gICAgY29uc3QgZGlmZiA9IHQgPT09IDAgPyAwIDogcmVjZWl2ZUFuZEV4dGVuZCh0KTtcclxuICAgIHp6WzBdID0gKGNvbXBvbmVudC5wcmVkICs9IGRpZmYpO1xyXG4gICAgbGV0IGsgPSAxO1xyXG5cclxuICAgIHdoaWxlIChrIDwgNjQpIHtcclxuICAgICAgY29uc3QgcnMgPSBkZWNvZGVIdWZmbWFuKGNvbXBvbmVudC5odWZmbWFuVGFibGVBQyEpO1xyXG4gICAgICBjb25zdCBzID0gcnMgJiAxNTtcclxuICAgICAgY29uc3QgciA9IHJzID4+IDQ7XHJcbiAgICAgIGlmIChzID09PSAwKSB7XHJcbiAgICAgICAgaWYgKHIgPCAxNSkgYnJlYWs7XHJcbiAgICAgICAgayArPSAxNjtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG4gICAgICBrICs9IHI7XHJcbiAgICAgIGNvbnN0IHogPSBkY3RaaWdaYWdba107XHJcbiAgICAgIHp6W3pdID0gcmVjZWl2ZUFuZEV4dGVuZChzKTtcclxuICAgICAgaysrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZGVjb2RlRENGaXJzdChjb21wb25lbnQ6IENvbXBvbmVudCwgeno6IEludDMyQXJyYXkpIHtcclxuICAgIGNvbnN0IHQgPSBkZWNvZGVIdWZmbWFuKGNvbXBvbmVudC5odWZmbWFuVGFibGVEQyEpO1xyXG4gICAgY29uc3QgZGlmZiA9IHQgPT09IDAgPyAwIDogKHJlY2VpdmVBbmRFeHRlbmQodCkgPDwgc3VjY2Vzc2l2ZSk7XHJcbiAgICB6elswXSA9IChjb21wb25lbnQucHJlZCArPSBkaWZmKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGRlY29kZURDU3VjY2Vzc2l2ZShfY29tcG9uZW50OiBDb21wb25lbnQsIHp6OiBJbnQzMkFycmF5KSB7XHJcbiAgICB6elswXSB8PSByZWFkQml0KCkgPDwgc3VjY2Vzc2l2ZTtcclxuICB9XHJcblxyXG4gIGxldCBlb2JydW4gPSAwO1xyXG5cclxuICBmdW5jdGlvbiBkZWNvZGVBQ0ZpcnN0KGNvbXBvbmVudDogQ29tcG9uZW50LCB6ejogSW50MzJBcnJheSkge1xyXG4gICAgaWYgKGVvYnJ1biA+IDApIHtcclxuICAgICAgZW9icnVuLS07XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBrID0gc3BlY3RyYWxTdGFydCwgZSA9IHNwZWN0cmFsRW5kO1xyXG4gICAgd2hpbGUgKGsgPD0gZSkge1xyXG4gICAgICBjb25zdCBycyA9IGRlY29kZUh1ZmZtYW4oY29tcG9uZW50Lmh1ZmZtYW5UYWJsZUFDISk7XHJcbiAgICAgIGNvbnN0IHMgPSBycyAmIDE1O1xyXG4gICAgICBjb25zdCByID0gcnMgPj4gNDtcclxuICAgICAgaWYgKHMgPT09IDApIHtcclxuICAgICAgICBpZiAociA8IDE1KSB7XHJcbiAgICAgICAgICBlb2JydW4gPSByZWNlaXZlKHIpICsgKDEgPDwgcikgLSAxO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGsgKz0gMTY7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgayArPSByO1xyXG4gICAgICBjb25zdCB6ID0gZGN0WmlnWmFnW2tdO1xyXG4gICAgICB6elt6XSA9IHJlY2VpdmVBbmRFeHRlbmQocykgKiAoMSA8PCBzdWNjZXNzaXZlKTtcclxuICAgICAgaysrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IHN1Y2Nlc3NpdmVBQ1N0YXRlID0gMDtcclxuICBsZXQgc3VjY2Vzc2l2ZUFDTmV4dFZhbHVlID0gMDtcclxuXHJcbiAgZnVuY3Rpb24gZGVjb2RlQUNTdWNjZXNzaXZlKGNvbXBvbmVudDogQ29tcG9uZW50LCB6ejogSW50MzJBcnJheSkge1xyXG4gICAgbGV0IGsgPSBzcGVjdHJhbFN0YXJ0O1xyXG4gICAgbGV0IGUgPSBzcGVjdHJhbEVuZDtcclxuICAgIGxldCByID0gMDtcclxuXHJcbiAgICB3aGlsZSAoayA8PSBlKSB7XHJcbiAgICAgIGNvbnN0IHogPSBkY3RaaWdaYWdba107XHJcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IHp6W3pdIDwgMCA/IC0xIDogMTtcclxuXHJcbiAgICAgIHN3aXRjaCAoc3VjY2Vzc2l2ZUFDU3RhdGUpIHtcclxuICAgICAgICBjYXNlIDA6IC8vIGluaXRpYWwgc3RhdGVcclxuICAgICAgICAgIGNvbnN0IHJzID0gZGVjb2RlSHVmZm1hbihjb21wb25lbnQuaHVmZm1hblRhYmxlQUMhKTtcclxuICAgICAgICAgIGNvbnN0IHMgPSBycyAmIDE1O1xyXG4gICAgICAgICAgciA9IHJzID4+IDQ7IC8vIHRoaXMgd2FzIG5ldyB2YXJpYWJsZSBpbiBvbGQgY29kZVxyXG4gICAgICAgICAgaWYgKHMgPT09IDApIHtcclxuICAgICAgICAgICAgaWYgKHIgPCAxNSkge1xyXG4gICAgICAgICAgICAgIGVvYnJ1biA9IHJlY2VpdmUocikgKyAoMSA8PCByKTtcclxuICAgICAgICAgICAgICBzdWNjZXNzaXZlQUNTdGF0ZSA9IDQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgciA9IDE2O1xyXG4gICAgICAgICAgICAgIHN1Y2Nlc3NpdmVBQ1N0YXRlID0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHMgIT09IDEpIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBBQ24gZW5jb2RpbmcnKTtcclxuICAgICAgICAgICAgc3VjY2Vzc2l2ZUFDTmV4dFZhbHVlID0gcmVjZWl2ZUFuZEV4dGVuZChzKTtcclxuICAgICAgICAgICAgc3VjY2Vzc2l2ZUFDU3RhdGUgPSByID8gMiA6IDM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICBjYXNlIDE6IC8vIHNraXBwaW5nIHIgemVybyBpdGVtc1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIGlmICh6elt6XSkge1xyXG4gICAgICAgICAgICB6elt6XSArPSAocmVhZEJpdCgpIDw8IHN1Y2Nlc3NpdmUpICogZGlyZWN0aW9uO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgci0tO1xyXG4gICAgICAgICAgICBpZiAociA9PT0gMCkgc3VjY2Vzc2l2ZUFDU3RhdGUgPSBzdWNjZXNzaXZlQUNTdGF0ZSA9PSAyID8gMyA6IDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6IC8vIHNldCB2YWx1ZSBmb3IgYSB6ZXJvIGl0ZW1cclxuICAgICAgICAgIGlmICh6elt6XSkge1xyXG4gICAgICAgICAgICB6elt6XSArPSAocmVhZEJpdCgpIDw8IHN1Y2Nlc3NpdmUpICogZGlyZWN0aW9uO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgenpbel0gPSBzdWNjZXNzaXZlQUNOZXh0VmFsdWUgPDwgc3VjY2Vzc2l2ZTtcclxuICAgICAgICAgICAgc3VjY2Vzc2l2ZUFDU3RhdGUgPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA0OiAvLyBlb2JcclxuICAgICAgICAgIGlmICh6elt6XSkge1xyXG4gICAgICAgICAgICB6elt6XSArPSAocmVhZEJpdCgpIDw8IHN1Y2Nlc3NpdmUpICogZGlyZWN0aW9uO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgaysrO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzdWNjZXNzaXZlQUNTdGF0ZSA9PT0gNCkge1xyXG4gICAgICBlb2JydW4tLTtcclxuICAgICAgaWYgKGVvYnJ1biA9PT0gMCkgc3VjY2Vzc2l2ZUFDU3RhdGUgPSAwO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZGVjb2RlTWN1KGNvbXBvbmVudDogQ29tcG9uZW50LCBkZWNvZGU6IERlY29kZUZuLCBtY3U6IG51bWJlciwgcm93OiBudW1iZXIsIGNvbDogbnVtYmVyKSB7XHJcbiAgICBjb25zdCBtY3VSb3cgPSAobWN1IC8gbWN1c1BlckxpbmUpIHwgMDtcclxuICAgIGNvbnN0IG1jdUNvbCA9IG1jdSAlIG1jdXNQZXJMaW5lO1xyXG4gICAgY29uc3QgYmxvY2tSb3cgPSBtY3VSb3cgKiBjb21wb25lbnQudiArIHJvdztcclxuICAgIGNvbnN0IGJsb2NrQ29sID0gbWN1Q29sICogY29tcG9uZW50LmggKyBjb2w7XHJcbiAgICAvLyBJZiB0aGUgYmxvY2sgaXMgbWlzc2luZywganVzdCBza2lwIGl0LlxyXG4gICAgaWYgKGNvbXBvbmVudC5ibG9ja3NbYmxvY2tSb3ddID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgIGRlY29kZShjb21wb25lbnQsIGNvbXBvbmVudC5ibG9ja3NbYmxvY2tSb3ddW2Jsb2NrQ29sXSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBkZWNvZGVCbG9jayhjb21wb25lbnQ6IENvbXBvbmVudCwgZGVjb2RlOiBEZWNvZGVGbiwgbWN1OiBudW1iZXIpIHtcclxuICAgIGNvbnN0IGJsb2NrUm93ID0gKG1jdSAvIGNvbXBvbmVudC5ibG9ja3NQZXJMaW5lKSB8IDA7XHJcbiAgICBjb25zdCBibG9ja0NvbCA9IG1jdSAlIGNvbXBvbmVudC5ibG9ja3NQZXJMaW5lO1xyXG4gICAgLy8gSWYgdGhlIGJsb2NrIGlzIG1pc3NpbmcsIGp1c3Qgc2tpcCBpdC5cclxuICAgIGlmIChjb21wb25lbnQuYmxvY2tzW2Jsb2NrUm93XSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICBkZWNvZGUoY29tcG9uZW50LCBjb21wb25lbnQuYmxvY2tzW2Jsb2NrUm93XVtibG9ja0NvbF0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29tcG9uZW50c0xlbmd0aCA9IGNvbXBvbmVudHMubGVuZ3RoO1xyXG4gIGxldCBjb21wb25lbnQ6IENvbXBvbmVudDtcclxuICBsZXQgZGVjb2RlRm46IERlY29kZUZuO1xyXG5cclxuICBpZiAocHJvZ3Jlc3NpdmUpIHtcclxuICAgIGlmIChzcGVjdHJhbFN0YXJ0ID09PSAwKSB7XHJcbiAgICAgIGRlY29kZUZuID0gc3VjY2Vzc2l2ZVByZXYgPT09IDAgPyBkZWNvZGVEQ0ZpcnN0IDogZGVjb2RlRENTdWNjZXNzaXZlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGVjb2RlRm4gPSBzdWNjZXNzaXZlUHJldiA9PT0gMCA/IGRlY29kZUFDRmlyc3QgOiBkZWNvZGVBQ1N1Y2Nlc3NpdmU7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGRlY29kZUZuID0gZGVjb2RlQmFzZWxpbmU7XHJcbiAgfVxyXG5cclxuICBsZXQgbWN1ID0gMDtcclxuICBsZXQgbWN1RXhwZWN0ZWQ6IG51bWJlcjtcclxuXHJcbiAgaWYgKGNvbXBvbmVudHNMZW5ndGggPT0gMSkge1xyXG4gICAgbWN1RXhwZWN0ZWQgPSBjb21wb25lbnRzWzBdLmJsb2Nrc1BlckxpbmUgKiBjb21wb25lbnRzWzBdLmJsb2Nrc1BlckNvbHVtbjtcclxuICB9IGVsc2Uge1xyXG4gICAgbWN1RXhwZWN0ZWQgPSBtY3VzUGVyTGluZSAqIGZyYW1lLm1jdXNQZXJDb2x1bW47XHJcbiAgfVxyXG5cclxuICBpZiAoIXJlc2V0SW50ZXJ2YWwpIHJlc2V0SW50ZXJ2YWwgPSBtY3VFeHBlY3RlZDtcclxuXHJcbiAgbGV0IGg6IG51bWJlcjtcclxuICBsZXQgdjogbnVtYmVyO1xyXG4gIGxldCBtYXJrZXI6IG51bWJlcjtcclxuXHJcbiAgd2hpbGUgKG1jdSA8IG1jdUV4cGVjdGVkKSB7XHJcbiAgICAvLyByZXNldCBpbnRlcnZhbCBzdHVmZlxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzTGVuZ3RoOyBpKyspIGNvbXBvbmVudHNbaV0ucHJlZCA9IDA7XHJcbiAgICBlb2JydW4gPSAwO1xyXG5cclxuICAgIGlmIChjb21wb25lbnRzTGVuZ3RoID09IDEpIHtcclxuICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50c1swXTtcclxuICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCByZXNldEludGVydmFsOyBuKyspIHtcclxuICAgICAgICBkZWNvZGVCbG9jayhjb21wb25lbnQsIGRlY29kZUZuLCBtY3UpO1xyXG4gICAgICAgIG1jdSsrO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmb3IgKGxldCBuID0gMDsgbiA8IHJlc2V0SW50ZXJ2YWw7IG4rKykge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50c0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnRzW2ldO1xyXG4gICAgICAgICAgaCA9IGNvbXBvbmVudC5oO1xyXG4gICAgICAgICAgdiA9IGNvbXBvbmVudC52O1xyXG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2OyBqKyspIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBoOyBrKyspIHtcclxuICAgICAgICAgICAgICBkZWNvZGVNY3UoY29tcG9uZW50LCBkZWNvZGVGbiwgbWN1LCBqLCBrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBtY3UrKztcclxuXHJcbiAgICAgICAgLy8gSWYgd2UndmUgcmVhY2hlZCBvdXIgZXhwZWN0ZWQgTUNVJ3MsIHN0b3AgZGVjb2RpbmdcclxuICAgICAgICBpZiAobWN1ID09PSBtY3VFeHBlY3RlZCkgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAobWN1ID09PSBtY3VFeHBlY3RlZCkge1xyXG4gICAgICAvLyBTa2lwIHRyYWlsaW5nIGJ5dGVzIGF0IHRoZSBlbmQgb2YgdGhlIHNjYW4gLSB1bnRpbCB3ZSByZWFjaCB0aGUgbmV4dCBtYXJrZXJcclxuICAgICAgZG8ge1xyXG4gICAgICAgIGlmIChkYXRhW29mZnNldF0gPT09IDB4RkYpIHtcclxuICAgICAgICAgIGlmIChkYXRhW29mZnNldCArIDFdICE9PSAweDAwKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBvZmZzZXQgKz0gMTtcclxuICAgICAgfSB3aGlsZSAob2Zmc2V0IDwgZGF0YS5sZW5ndGggLSAyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBmaW5kIG1hcmtlclxyXG4gICAgYml0c0NvdW50ID0gMDtcclxuICAgIG1hcmtlciA9IChkYXRhW29mZnNldF0gPDwgOCkgfCBkYXRhW29mZnNldCArIDFdO1xyXG5cclxuICAgIGlmIChtYXJrZXIgPCAweEZGMDApIHRocm93IG5ldyBFcnJvcignbWFya2VyIHdhcyBub3QgZm91bmQnKTtcclxuXHJcbiAgICBpZiAobWFya2VyID49IDB4RkZEMCAmJiBtYXJrZXIgPD0gMHhGRkQ3KSB7IC8vIFJTVHhcclxuICAgICAgb2Zmc2V0ICs9IDI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBvZmZzZXQgLSBzdGFydE9mZnNldDtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRDb21wb25lbnREYXRhKGNvbXBvbmVudDogQ29tcG9uZW50KSB7XHJcbiAgY29uc3QgbGluZXMgPSBbXTtcclxuICBjb25zdCBibG9ja3NQZXJMaW5lID0gY29tcG9uZW50LmJsb2Nrc1BlckxpbmU7XHJcbiAgY29uc3QgYmxvY2tzUGVyQ29sdW1uID0gY29tcG9uZW50LmJsb2Nrc1BlckNvbHVtbjtcclxuICBjb25zdCBzYW1wbGVzUGVyTGluZSA9IGJsb2Nrc1BlckxpbmUgPDwgMztcclxuICAvLyBPbmx5IDEgdXNlZCBwZXIgaW52b2NhdGlvbiBvZiB0aGlzIGZ1bmN0aW9uIGFuZCBnYXJiYWdlIGNvbGxlY3RlZCBhZnRlciBpbnZvY2F0aW9uLCBzbyBubyBuZWVkIHRvIGFjY291bnQgZm9yIGl0cyBtZW1vcnkgZm9vdHByaW50LlxyXG4gIGNvbnN0IFIgPSBuZXcgSW50MzJBcnJheSg2NCk7XHJcbiAgY29uc3QgciA9IG5ldyBVaW50OEFycmF5KDY0KTtcclxuXHJcbiAgLy8gQSBwb3J0IG9mIHBvcHBsZXIncyBJRENUIG1ldGhvZCB3aGljaCBpbiB0dXJuIGlzIHRha2VuIGZyb206XHJcbiAgLy8gICBDaHJpc3RvcGggTG9lZmZsZXIsIEFkcmlhYW4gTGlndGVuYmVyZywgR2VvcmdlIFMuIE1vc2NoeXR6LFxyXG4gIC8vICAgXCJQcmFjdGljYWwgRmFzdCAxLUQgRENUIEFsZ29yaXRobXMgd2l0aCAxMSBNdWx0aXBsaWNhdGlvbnNcIixcclxuICAvLyAgIElFRUUgSW50bC4gQ29uZi4gb24gQWNvdXN0aWNzLCBTcGVlY2ggJiBTaWduYWwgUHJvY2Vzc2luZywgMTk4OSxcclxuICAvLyAgIDk4OC05OTEuXHJcbiAgZnVuY3Rpb24gcXVhbnRpemVBbmRJbnZlcnNlKHp6OiBJbnQzMkFycmF5LCBkYXRhT3V0OiBVaW50OEFycmF5LCBkYXRhSW46IEludDMyQXJyYXkpIHtcclxuICAgIGNvbnN0IHF0ID0gY29tcG9uZW50LnF1YW50aXphdGlvblRhYmxlITtcclxuICAgIGNvbnN0IHAgPSBkYXRhSW47XHJcblxyXG4gICAgLy8gZGVxdWFudFxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2NDsgaSsrKSB7XHJcbiAgICAgIHBbaV0gPSB6eltpXSAqIHF0W2ldO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGludmVyc2UgRENUIG9uIHJvd3NcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgODsgKytpKSB7XHJcbiAgICAgIGNvbnN0IHJvdyA9IDggKiBpO1xyXG5cclxuICAgICAgLy8gY2hlY2sgZm9yIGFsbC16ZXJvIEFDIGNvZWZmaWNpZW50c1xyXG4gICAgICBpZiAocFsxICsgcm93XSA9PSAwICYmIHBbMiArIHJvd10gPT0gMCAmJiBwWzMgKyByb3ddID09IDAgJiZcclxuICAgICAgICBwWzQgKyByb3ddID09IDAgJiYgcFs1ICsgcm93XSA9PSAwICYmIHBbNiArIHJvd10gPT0gMCAmJlxyXG4gICAgICAgIHBbNyArIHJvd10gPT0gMCkge1xyXG4gICAgICAgIGNvbnN0IHQgPSAoZGN0U3FydDIgKiBwWzAgKyByb3ddICsgNTEyKSA+PiAxMDtcclxuICAgICAgICBwWzAgKyByb3ddID0gdDtcclxuICAgICAgICBwWzEgKyByb3ddID0gdDtcclxuICAgICAgICBwWzIgKyByb3ddID0gdDtcclxuICAgICAgICBwWzMgKyByb3ddID0gdDtcclxuICAgICAgICBwWzQgKyByb3ddID0gdDtcclxuICAgICAgICBwWzUgKyByb3ddID0gdDtcclxuICAgICAgICBwWzYgKyByb3ddID0gdDtcclxuICAgICAgICBwWzcgKyByb3ddID0gdDtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc3RhZ2UgNFxyXG4gICAgICBsZXQgdjAgPSAoZGN0U3FydDIgKiBwWzAgKyByb3ddICsgMTI4KSA+PiA4O1xyXG4gICAgICBsZXQgdjEgPSAoZGN0U3FydDIgKiBwWzQgKyByb3ddICsgMTI4KSA+PiA4O1xyXG4gICAgICBsZXQgdjIgPSBwWzIgKyByb3ddO1xyXG4gICAgICBsZXQgdjMgPSBwWzYgKyByb3ddO1xyXG4gICAgICBsZXQgdjQgPSAoZGN0U3FydDFkMiAqIChwWzEgKyByb3ddIC0gcFs3ICsgcm93XSkgKyAxMjgpID4+IDg7XHJcbiAgICAgIGxldCB2NyA9IChkY3RTcXJ0MWQyICogKHBbMSArIHJvd10gKyBwWzcgKyByb3ddKSArIDEyOCkgPj4gODtcclxuICAgICAgbGV0IHY1ID0gcFszICsgcm93XSA8PCA0O1xyXG4gICAgICBsZXQgdjYgPSBwWzUgKyByb3ddIDw8IDQ7XHJcblxyXG4gICAgICAvLyBzdGFnZSAzXHJcbiAgICAgIGxldCB0ID0gKHYwIC0gdjEgKyAxKSA+PiAxO1xyXG4gICAgICB2MCA9ICh2MCArIHYxICsgMSkgPj4gMTtcclxuICAgICAgdjEgPSB0O1xyXG4gICAgICB0ID0gKHYyICogZGN0U2luNiArIHYzICogZGN0Q29zNiArIDEyOCkgPj4gODtcclxuICAgICAgdjIgPSAodjIgKiBkY3RDb3M2IC0gdjMgKiBkY3RTaW42ICsgMTI4KSA+PiA4O1xyXG4gICAgICB2MyA9IHQ7XHJcbiAgICAgIHQgPSAodjQgLSB2NiArIDEpID4+IDE7XHJcbiAgICAgIHY0ID0gKHY0ICsgdjYgKyAxKSA+PiAxO1xyXG4gICAgICB2NiA9IHQ7XHJcbiAgICAgIHQgPSAodjcgKyB2NSArIDEpID4+IDE7XHJcbiAgICAgIHY1ID0gKHY3IC0gdjUgKyAxKSA+PiAxO1xyXG4gICAgICB2NyA9IHQ7XHJcblxyXG4gICAgICAvLyBzdGFnZSAyXHJcbiAgICAgIHQgPSAodjAgLSB2MyArIDEpID4+IDE7XHJcbiAgICAgIHYwID0gKHYwICsgdjMgKyAxKSA+PiAxO1xyXG4gICAgICB2MyA9IHQ7XHJcbiAgICAgIHQgPSAodjEgLSB2MiArIDEpID4+IDE7XHJcbiAgICAgIHYxID0gKHYxICsgdjIgKyAxKSA+PiAxO1xyXG4gICAgICB2MiA9IHQ7XHJcbiAgICAgIHQgPSAodjQgKiBkY3RTaW4zICsgdjcgKiBkY3RDb3MzICsgMjA0OCkgPj4gMTI7XHJcbiAgICAgIHY0ID0gKHY0ICogZGN0Q29zMyAtIHY3ICogZGN0U2luMyArIDIwNDgpID4+IDEyO1xyXG4gICAgICB2NyA9IHQ7XHJcbiAgICAgIHQgPSAodjUgKiBkY3RTaW4xICsgdjYgKiBkY3RDb3MxICsgMjA0OCkgPj4gMTI7XHJcbiAgICAgIHY1ID0gKHY1ICogZGN0Q29zMSAtIHY2ICogZGN0U2luMSArIDIwNDgpID4+IDEyO1xyXG4gICAgICB2NiA9IHQ7XHJcblxyXG4gICAgICAvLyBzdGFnZSAxXHJcbiAgICAgIHBbMCArIHJvd10gPSB2MCArIHY3O1xyXG4gICAgICBwWzcgKyByb3ddID0gdjAgLSB2NztcclxuICAgICAgcFsxICsgcm93XSA9IHYxICsgdjY7XHJcbiAgICAgIHBbNiArIHJvd10gPSB2MSAtIHY2O1xyXG4gICAgICBwWzIgKyByb3ddID0gdjIgKyB2NTtcclxuICAgICAgcFs1ICsgcm93XSA9IHYyIC0gdjU7XHJcbiAgICAgIHBbMyArIHJvd10gPSB2MyArIHY0O1xyXG4gICAgICBwWzQgKyByb3ddID0gdjMgLSB2NDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbnZlcnNlIERDVCBvbiBjb2x1bW5zXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDg7ICsraSkge1xyXG4gICAgICBjb25zdCBjb2wgPSBpO1xyXG5cclxuICAgICAgLy8gY2hlY2sgZm9yIGFsbC16ZXJvIEFDIGNvZWZmaWNpZW50c1xyXG4gICAgICBpZiAocFsxICogOCArIGNvbF0gPT0gMCAmJiBwWzIgKiA4ICsgY29sXSA9PSAwICYmIHBbMyAqIDggKyBjb2xdID09IDAgJiZcclxuICAgICAgICBwWzQgKiA4ICsgY29sXSA9PSAwICYmIHBbNSAqIDggKyBjb2xdID09IDAgJiYgcFs2ICogOCArIGNvbF0gPT0gMCAmJlxyXG4gICAgICAgIHBbNyAqIDggKyBjb2xdID09IDApIHtcclxuICAgICAgICBjb25zdCB0ID0gKGRjdFNxcnQyICogZGF0YUluW2kgKyAwXSArIDgxOTIpID4+IDE0O1xyXG4gICAgICAgIHBbMCAqIDggKyBjb2xdID0gdDtcclxuICAgICAgICBwWzEgKiA4ICsgY29sXSA9IHQ7XHJcbiAgICAgICAgcFsyICogOCArIGNvbF0gPSB0O1xyXG4gICAgICAgIHBbMyAqIDggKyBjb2xdID0gdDtcclxuICAgICAgICBwWzQgKiA4ICsgY29sXSA9IHQ7XHJcbiAgICAgICAgcFs1ICogOCArIGNvbF0gPSB0O1xyXG4gICAgICAgIHBbNiAqIDggKyBjb2xdID0gdDtcclxuICAgICAgICBwWzcgKiA4ICsgY29sXSA9IHQ7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHN0YWdlIDRcclxuICAgICAgbGV0IHYwID0gKGRjdFNxcnQyICogcFswICogOCArIGNvbF0gKyAyMDQ4KSA+PiAxMjtcclxuICAgICAgbGV0IHYxID0gKGRjdFNxcnQyICogcFs0ICogOCArIGNvbF0gKyAyMDQ4KSA+PiAxMjtcclxuICAgICAgbGV0IHYyID0gcFsyICogOCArIGNvbF07XHJcbiAgICAgIGxldCB2MyA9IHBbNiAqIDggKyBjb2xdO1xyXG4gICAgICBsZXQgdjQgPSAoZGN0U3FydDFkMiAqIChwWzEgKiA4ICsgY29sXSAtIHBbNyAqIDggKyBjb2xdKSArIDIwNDgpID4+IDEyO1xyXG4gICAgICBsZXQgdjcgPSAoZGN0U3FydDFkMiAqIChwWzEgKiA4ICsgY29sXSArIHBbNyAqIDggKyBjb2xdKSArIDIwNDgpID4+IDEyO1xyXG4gICAgICBsZXQgdjUgPSBwWzMgKiA4ICsgY29sXTtcclxuICAgICAgbGV0IHY2ID0gcFs1ICogOCArIGNvbF07XHJcblxyXG4gICAgICAvLyBzdGFnZSAzXHJcbiAgICAgIGxldCB0ID0gKHYwIC0gdjEgKyAxKSA+PiAxO1xyXG4gICAgICB2MCA9ICh2MCArIHYxICsgMSkgPj4gMTtcclxuICAgICAgdjEgPSB0O1xyXG4gICAgICB0ID0gKHYyICogZGN0U2luNiArIHYzICogZGN0Q29zNiArIDIwNDgpID4+IDEyO1xyXG4gICAgICB2MiA9ICh2MiAqIGRjdENvczYgLSB2MyAqIGRjdFNpbjYgKyAyMDQ4KSA+PiAxMjtcclxuICAgICAgdjMgPSB0O1xyXG4gICAgICB0ID0gKHY0IC0gdjYgKyAxKSA+PiAxO1xyXG4gICAgICB2NCA9ICh2NCArIHY2ICsgMSkgPj4gMTtcclxuICAgICAgdjYgPSB0O1xyXG4gICAgICB0ID0gKHY3ICsgdjUgKyAxKSA+PiAxO1xyXG4gICAgICB2NSA9ICh2NyAtIHY1ICsgMSkgPj4gMTtcclxuICAgICAgdjcgPSB0O1xyXG5cclxuICAgICAgLy8gc3RhZ2UgMlxyXG4gICAgICB0ID0gKHYwIC0gdjMgKyAxKSA+PiAxO1xyXG4gICAgICB2MCA9ICh2MCArIHYzICsgMSkgPj4gMTtcclxuICAgICAgdjMgPSB0O1xyXG4gICAgICB0ID0gKHYxIC0gdjIgKyAxKSA+PiAxO1xyXG4gICAgICB2MSA9ICh2MSArIHYyICsgMSkgPj4gMTtcclxuICAgICAgdjIgPSB0O1xyXG4gICAgICB0ID0gKHY0ICogZGN0U2luMyArIHY3ICogZGN0Q29zMyArIDIwNDgpID4+IDEyO1xyXG4gICAgICB2NCA9ICh2NCAqIGRjdENvczMgLSB2NyAqIGRjdFNpbjMgKyAyMDQ4KSA+PiAxMjtcclxuICAgICAgdjcgPSB0O1xyXG4gICAgICB0ID0gKHY1ICogZGN0U2luMSArIHY2ICogZGN0Q29zMSArIDIwNDgpID4+IDEyO1xyXG4gICAgICB2NSA9ICh2NSAqIGRjdENvczEgLSB2NiAqIGRjdFNpbjEgKyAyMDQ4KSA+PiAxMjtcclxuICAgICAgdjYgPSB0O1xyXG5cclxuICAgICAgLy8gc3RhZ2UgMVxyXG4gICAgICBwWzAgKiA4ICsgY29sXSA9IHYwICsgdjc7XHJcbiAgICAgIHBbNyAqIDggKyBjb2xdID0gdjAgLSB2NztcclxuICAgICAgcFsxICogOCArIGNvbF0gPSB2MSArIHY2O1xyXG4gICAgICBwWzYgKiA4ICsgY29sXSA9IHYxIC0gdjY7XHJcbiAgICAgIHBbMiAqIDggKyBjb2xdID0gdjIgKyB2NTtcclxuICAgICAgcFs1ICogOCArIGNvbF0gPSB2MiAtIHY1O1xyXG4gICAgICBwWzMgKiA4ICsgY29sXSA9IHYzICsgdjQ7XHJcbiAgICAgIHBbNCAqIDggKyBjb2xdID0gdjMgLSB2NDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb252ZXJ0IHRvIDgtYml0IGludGVnZXJzXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDY0OyArK2kpIHtcclxuICAgICAgY29uc3Qgc2FtcGxlID0gMTI4ICsgKChwW2ldICsgOCkgPj4gNCk7XHJcbiAgICAgIGRhdGFPdXRbaV0gPSBzYW1wbGUgPCAwID8gMCA6IHNhbXBsZSA+IDB4RkYgPyAweEZGIDogc2FtcGxlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVxdWVzdE1lbW9yeUFsbG9jYXRpb24oc2FtcGxlc1BlckxpbmUgKiBibG9ja3NQZXJDb2x1bW4gKiA4KTtcclxuXHJcbiAgZm9yIChsZXQgYmxvY2tSb3cgPSAwOyBibG9ja1JvdyA8IGJsb2Nrc1BlckNvbHVtbjsgYmxvY2tSb3crKykge1xyXG4gICAgY29uc3Qgc2NhbkxpbmUgPSBibG9ja1JvdyA8PCAzO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgODsgaSsrKVxyXG4gICAgICBsaW5lcy5wdXNoKG5ldyBVaW50OEFycmF5KHNhbXBsZXNQZXJMaW5lKSk7XHJcblxyXG4gICAgZm9yIChsZXQgYmxvY2tDb2wgPSAwOyBibG9ja0NvbCA8IGJsb2Nrc1BlckxpbmU7IGJsb2NrQ29sKyspIHtcclxuICAgICAgcXVhbnRpemVBbmRJbnZlcnNlKGNvbXBvbmVudC5ibG9ja3NbYmxvY2tSb3ddW2Jsb2NrQ29sXSwgciwgUik7XHJcblxyXG4gICAgICBsZXQgb2Zmc2V0ID0gMDtcclxuICAgICAgY29uc3Qgc2FtcGxlID0gYmxvY2tDb2wgPDwgMztcclxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCA4OyBqKyspIHtcclxuICAgICAgICBjb25zdCBsaW5lID0gbGluZXNbc2NhbkxpbmUgKyBqXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKylcclxuICAgICAgICAgIGxpbmVbc2FtcGxlICsgaV0gPSByW29mZnNldCsrXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gbGluZXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsYW1wVG84Yml0KGE6IG51bWJlcikge1xyXG4gIHJldHVybiBhIDwgMCA/IDAgOiBhID4gMjU1ID8gMjU1IDogYTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2UoZGF0YTogVWludDhBcnJheSkge1xyXG4gIGNvbnN0IHNlbGY6IERlY29kZWQgPSB7XHJcbiAgICB3aWR0aDogMCxcclxuICAgIGhlaWdodDogMCxcclxuICAgIGNvbW1lbnRzOiBbXSxcclxuICAgIGFkb2JlOiB1bmRlZmluZWQsXHJcbiAgICBjb21wb25lbnRzOiBbXSxcclxuICAgIGV4aWZCdWZmZXI6IHVuZGVmaW5lZCxcclxuICAgIGpmaWY6IHVuZGVmaW5lZCxcclxuICB9O1xyXG5cclxuICBjb25zdCBtYXhSZXNvbHV0aW9uSW5QaXhlbHMgPSBtYXhSZXNvbHV0aW9uSW5NUCAqIDEwMDAgKiAxMDAwO1xyXG4gIGxldCBvZmZzZXQgPSAwO1xyXG5cclxuICBmdW5jdGlvbiByZWFkVWludDE2KCkge1xyXG4gICAgY29uc3QgdmFsdWUgPSAoZGF0YVtvZmZzZXRdIDw8IDgpIHwgZGF0YVtvZmZzZXQgKyAxXTtcclxuICAgIG9mZnNldCArPSAyO1xyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcmVhZERhdGFCbG9jaygpIHtcclxuICAgIGNvbnN0IGxlbmd0aCA9IHJlYWRVaW50MTYoKTtcclxuICAgIGNvbnN0IGFycmF5ID0gZGF0YS5zdWJhcnJheShvZmZzZXQsIG9mZnNldCArIGxlbmd0aCAtIDIpO1xyXG4gICAgb2Zmc2V0ICs9IGFycmF5Lmxlbmd0aDtcclxuICAgIHJldHVybiBhcnJheTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHByZXBhcmVDb21wb25lbnRzKGZyYW1lOiBGcmFtZSkge1xyXG4gICAgbGV0IG1heEggPSAwLCBtYXhWID0gMDtcclxuXHJcbiAgICBmb3IgKGxldCBjb21wb25lbnRJZCBpbiBmcmFtZS5jb21wb25lbnRzKSB7XHJcbiAgICAgIGlmIChmcmFtZS5jb21wb25lbnRzLmhhc093blByb3BlcnR5KGNvbXBvbmVudElkKSkge1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGZyYW1lLmNvbXBvbmVudHNbY29tcG9uZW50SWRdO1xyXG4gICAgICAgIGlmIChtYXhIIDwgY29tcG9uZW50LmgpIG1heEggPSBjb21wb25lbnQuaDtcclxuICAgICAgICBpZiAobWF4ViA8IGNvbXBvbmVudC52KSBtYXhWID0gY29tcG9uZW50LnY7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtY3VzUGVyTGluZSA9IE1hdGguY2VpbChmcmFtZS5zYW1wbGVzUGVyTGluZSAvIDggLyBtYXhIKTtcclxuICAgIGNvbnN0IG1jdXNQZXJDb2x1bW4gPSBNYXRoLmNlaWwoZnJhbWUuc2NhbkxpbmVzIC8gOCAvIG1heFYpO1xyXG5cclxuICAgIGZvciAobGV0IGNvbXBvbmVudElkIGluIGZyYW1lLmNvbXBvbmVudHMpIHtcclxuICAgICAgaWYgKGZyYW1lLmNvbXBvbmVudHMuaGFzT3duUHJvcGVydHkoY29tcG9uZW50SWQpKSB7XHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZnJhbWUuY29tcG9uZW50c1tjb21wb25lbnRJZF07XHJcbiAgICAgICAgY29uc3QgYmxvY2tzUGVyTGluZSA9IE1hdGguY2VpbChNYXRoLmNlaWwoZnJhbWUuc2FtcGxlc1BlckxpbmUgLyA4KSAqIGNvbXBvbmVudC5oIC8gbWF4SCk7XHJcbiAgICAgICAgY29uc3QgYmxvY2tzUGVyQ29sdW1uID0gTWF0aC5jZWlsKE1hdGguY2VpbChmcmFtZS5zY2FuTGluZXMgLyA4KSAqIGNvbXBvbmVudC52IC8gbWF4Vik7XHJcbiAgICAgICAgY29uc3QgYmxvY2tzUGVyTGluZUZvck1jdSA9IG1jdXNQZXJMaW5lICogY29tcG9uZW50Lmg7XHJcbiAgICAgICAgY29uc3QgYmxvY2tzUGVyQ29sdW1uRm9yTWN1ID0gbWN1c1BlckNvbHVtbiAqIGNvbXBvbmVudC52O1xyXG4gICAgICAgIGNvbnN0IGJsb2Nrc1RvQWxsb2NhdGUgPSBibG9ja3NQZXJDb2x1bW5Gb3JNY3UgKiBibG9ja3NQZXJMaW5lRm9yTWN1O1xyXG4gICAgICAgIGNvbnN0IGJsb2NrczogSW50MzJBcnJheVtdW10gPSBbXTtcclxuXHJcbiAgICAgICAgLy8gRWFjaCBibG9jayBpcyBhIEludDMyQXJyYXkgb2YgbGVuZ3RoIDY0ICg0IHggNjQgPSAyNTYgYnl0ZXMpXHJcbiAgICAgICAgcmVxdWVzdE1lbW9yeUFsbG9jYXRpb24oYmxvY2tzVG9BbGxvY2F0ZSAqIDI1Nik7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzUGVyQ29sdW1uRm9yTWN1OyBpKyspIHtcclxuICAgICAgICAgIGNvbnN0IHJvdzogSW50MzJBcnJheVtdID0gW107XHJcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGJsb2Nrc1BlckxpbmVGb3JNY3U7IGorKykge1xyXG4gICAgICAgICAgICByb3cucHVzaChuZXcgSW50MzJBcnJheSg2NCkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYmxvY2tzLnB1c2gocm93KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29tcG9uZW50LmJsb2Nrc1BlckxpbmUgPSBibG9ja3NQZXJMaW5lO1xyXG4gICAgICAgIGNvbXBvbmVudC5ibG9ja3NQZXJDb2x1bW4gPSBibG9ja3NQZXJDb2x1bW47XHJcbiAgICAgICAgY29tcG9uZW50LmJsb2NrcyA9IGJsb2NrcztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZyYW1lLm1heEggPSBtYXhIO1xyXG4gICAgZnJhbWUubWF4ViA9IG1heFY7XHJcbiAgICBmcmFtZS5tY3VzUGVyTGluZSA9IG1jdXNQZXJMaW5lO1xyXG4gICAgZnJhbWUubWN1c1BlckNvbHVtbiA9IG1jdXNQZXJDb2x1bW47XHJcbiAgfVxyXG5cclxuICBsZXQgamZpZiA9IG51bGw7XHJcbiAgbGV0IGFkb2JlID0gbnVsbDtcclxuICBsZXQgZnJhbWU6IEZyYW1lIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xyXG4gIGxldCByZXNldEludGVydmFsID0gMDtcclxuICBsZXQgcXVhbnRpemF0aW9uVGFibGVzID0gW107XHJcbiAgbGV0IGZyYW1lczogRnJhbWVbXSA9IFtdO1xyXG4gIGxldCBodWZmbWFuVGFibGVzQUM6IChudW1iZXJbXSB8IG51bWJlcltdW10pW10gPSBbXTtcclxuICBsZXQgaHVmZm1hblRhYmxlc0RDOiAobnVtYmVyW10gfCBudW1iZXJbXVtdKVtdID0gW107XHJcbiAgbGV0IGZpbGVNYXJrZXIgPSByZWFkVWludDE2KCk7XHJcbiAgbGV0IG1hbGZvcm1lZERhdGFPZmZzZXQgPSAtMTtcclxuXHJcbiAgaWYgKGZpbGVNYXJrZXIgIT0gMHhGRkQ4KSB7IC8vIFNPSSAoU3RhcnQgb2YgSW1hZ2UpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NPSSBub3QgZm91bmQnKTtcclxuICB9XHJcblxyXG4gIGZpbGVNYXJrZXIgPSByZWFkVWludDE2KCk7XHJcbiAgd2hpbGUgKGZpbGVNYXJrZXIgIT0gMHhGRkQ5KSB7IC8vIEVPSSAoRW5kIG9mIGltYWdlKVxyXG4gICAgc3dpdGNoIChmaWxlTWFya2VyKSB7XHJcbiAgICAgIGNhc2UgMHhGRjAwOiBicmVhaztcclxuICAgICAgY2FzZSAweEZGRTA6IC8vIEFQUDAgKEFwcGxpY2F0aW9uIFNwZWNpZmljKVxyXG4gICAgICBjYXNlIDB4RkZFMTogLy8gQVBQMVxyXG4gICAgICBjYXNlIDB4RkZFMjogLy8gQVBQMlxyXG4gICAgICBjYXNlIDB4RkZFMzogLy8gQVBQM1xyXG4gICAgICBjYXNlIDB4RkZFNDogLy8gQVBQNFxyXG4gICAgICBjYXNlIDB4RkZFNTogLy8gQVBQNVxyXG4gICAgICBjYXNlIDB4RkZFNjogLy8gQVBQNlxyXG4gICAgICBjYXNlIDB4RkZFNzogLy8gQVBQN1xyXG4gICAgICBjYXNlIDB4RkZFODogLy8gQVBQOFxyXG4gICAgICBjYXNlIDB4RkZFOTogLy8gQVBQOVxyXG4gICAgICBjYXNlIDB4RkZFQTogLy8gQVBQMTBcclxuICAgICAgY2FzZSAweEZGRUI6IC8vIEFQUDExXHJcbiAgICAgIGNhc2UgMHhGRkVDOiAvLyBBUFAxMlxyXG4gICAgICBjYXNlIDB4RkZFRDogLy8gQVBQMTNcclxuICAgICAgY2FzZSAweEZGRUU6IC8vIEFQUDE0XHJcbiAgICAgIGNhc2UgMHhGRkVGOiAvLyBBUFAxNVxyXG4gICAgICBjYXNlIDB4RkZGRTogeyAvLyBDT00gKENvbW1lbnQpXHJcbiAgICAgICAgY29uc3QgYXBwRGF0YSA9IHJlYWREYXRhQmxvY2soKTtcclxuXHJcbiAgICAgICAgaWYgKGZpbGVNYXJrZXIgPT09IDB4RkZGRSkge1xyXG4gICAgICAgICAgbGV0IGNvbW1lbnQgPSAnJztcclxuICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBhcHBEYXRhLmJ5dGVMZW5ndGg7IGlpKyspIHtcclxuICAgICAgICAgICAgY29tbWVudCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGFwcERhdGFbaWldKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHNlbGYuY29tbWVudHMucHVzaChjb21tZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmaWxlTWFya2VyID09PSAweEZGRTApIHtcclxuICAgICAgICAgIGlmIChhcHBEYXRhWzBdID09PSAweDRBICYmIGFwcERhdGFbMV0gPT09IDB4NDYgJiYgYXBwRGF0YVsyXSA9PT0gMHg0OSAmJlxyXG4gICAgICAgICAgICBhcHBEYXRhWzNdID09PSAweDQ2ICYmIGFwcERhdGFbNF0gPT09IDApIHsgLy8gJ0pGSUZcXHgwMCdcclxuICAgICAgICAgICAgamZpZiA9IHtcclxuICAgICAgICAgICAgICB2ZXJzaW9uOiB7IG1ham9yOiBhcHBEYXRhWzVdLCBtaW5vcjogYXBwRGF0YVs2XSB9LFxyXG4gICAgICAgICAgICAgIGRlbnNpdHlVbml0czogYXBwRGF0YVs3XSxcclxuICAgICAgICAgICAgICB4RGVuc2l0eTogKGFwcERhdGFbOF0gPDwgOCkgfCBhcHBEYXRhWzldLFxyXG4gICAgICAgICAgICAgIHlEZW5zaXR5OiAoYXBwRGF0YVsxMF0gPDwgOCkgfCBhcHBEYXRhWzExXSxcclxuICAgICAgICAgICAgICB0aHVtYldpZHRoOiBhcHBEYXRhWzEyXSxcclxuICAgICAgICAgICAgICB0aHVtYkhlaWdodDogYXBwRGF0YVsxM10sXHJcbiAgICAgICAgICAgICAgdGh1bWJEYXRhOiBhcHBEYXRhLnN1YmFycmF5KDE0LCAxNCArIDMgKiBhcHBEYXRhWzEyXSAqIGFwcERhdGFbMTNdKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUT0RPIEFQUDEgLSBFeGlmXHJcbiAgICAgICAgaWYgKGZpbGVNYXJrZXIgPT09IDB4RkZFMSkge1xyXG4gICAgICAgICAgaWYgKGFwcERhdGFbMF0gPT09IDB4NDUgJiZcclxuICAgICAgICAgICAgYXBwRGF0YVsxXSA9PT0gMHg3OCAmJlxyXG4gICAgICAgICAgICBhcHBEYXRhWzJdID09PSAweDY5ICYmXHJcbiAgICAgICAgICAgIGFwcERhdGFbM10gPT09IDB4NjYgJiZcclxuICAgICAgICAgICAgYXBwRGF0YVs0XSA9PT0gMCkgeyAvLyAnRVhJRlxceDAwJ1xyXG4gICAgICAgICAgICBzZWxmLmV4aWZCdWZmZXIgPSBhcHBEYXRhLnN1YmFycmF5KDUsIGFwcERhdGEubGVuZ3RoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmaWxlTWFya2VyID09PSAweEZGRUUpIHtcclxuICAgICAgICAgIGlmIChhcHBEYXRhWzBdID09PSAweDQxICYmIGFwcERhdGFbMV0gPT09IDB4NjQgJiYgYXBwRGF0YVsyXSA9PT0gMHg2RiAmJlxyXG4gICAgICAgICAgICBhcHBEYXRhWzNdID09PSAweDYyICYmIGFwcERhdGFbNF0gPT09IDB4NjUgJiYgYXBwRGF0YVs1XSA9PT0gMCkgeyAvLyAnQWRvYmVcXHgwMCdcclxuICAgICAgICAgICAgYWRvYmUgPSB7XHJcbiAgICAgICAgICAgICAgdmVyc2lvbjogYXBwRGF0YVs2XSxcclxuICAgICAgICAgICAgICBmbGFnczA6IChhcHBEYXRhWzddIDw8IDgpIHwgYXBwRGF0YVs4XSxcclxuICAgICAgICAgICAgICBmbGFnczE6IChhcHBEYXRhWzldIDw8IDgpIHwgYXBwRGF0YVsxMF0sXHJcbiAgICAgICAgICAgICAgdHJhbnNmb3JtQ29kZTogYXBwRGF0YVsxMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAweEZGREI6IHsgLy8gRFFUIChEZWZpbmUgUXVhbnRpemF0aW9uIFRhYmxlcylcclxuICAgICAgICBjb25zdCBxdWFudGl6YXRpb25UYWJsZXNMZW5ndGggPSByZWFkVWludDE2KCk7XHJcbiAgICAgICAgY29uc3QgcXVhbnRpemF0aW9uVGFibGVzRW5kID0gcXVhbnRpemF0aW9uVGFibGVzTGVuZ3RoICsgb2Zmc2V0IC0gMjtcclxuICAgICAgICB3aGlsZSAob2Zmc2V0IDwgcXVhbnRpemF0aW9uVGFibGVzRW5kKSB7XHJcbiAgICAgICAgICBjb25zdCBxdWFudGl6YXRpb25UYWJsZVNwZWMgPSBkYXRhW29mZnNldCsrXTtcclxuICAgICAgICAgIHJlcXVlc3RNZW1vcnlBbGxvY2F0aW9uKDY0ICogNCk7XHJcbiAgICAgICAgICBjb25zdCB0YWJsZURhdGEgPSBuZXcgSW50MzJBcnJheSg2NCk7XHJcbiAgICAgICAgICBpZiAoKHF1YW50aXphdGlvblRhYmxlU3BlYyA+PiA0KSA9PT0gMCkgeyAvLyA4IGJpdCB2YWx1ZXNcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCA2NDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgeiA9IGRjdFppZ1phZ1tqXTtcclxuICAgICAgICAgICAgICB0YWJsZURhdGFbel0gPSBkYXRhW29mZnNldCsrXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIGlmICgocXVhbnRpemF0aW9uVGFibGVTcGVjID4+IDQpID09PSAxKSB7IC8vMTYgYml0XHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgNjQ7IGorKykge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHogPSBkY3RaaWdaYWdbal07XHJcbiAgICAgICAgICAgICAgdGFibGVEYXRhW3pdID0gcmVhZFVpbnQxNigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEUVQ6IGludmFsaWQgdGFibGUgc3BlYycpO1xyXG4gICAgICAgICAgcXVhbnRpemF0aW9uVGFibGVzW3F1YW50aXphdGlvblRhYmxlU3BlYyAmIDE1XSA9IHRhYmxlRGF0YTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAweEZGQzA6IC8vIFNPRjAgKFN0YXJ0IG9mIEZyYW1lLCBCYXNlbGluZSBEQ1QpXHJcbiAgICAgIGNhc2UgMHhGRkMxOiAvLyBTT0YxIChTdGFydCBvZiBGcmFtZSwgRXh0ZW5kZWQgRENUKVxyXG4gICAgICBjYXNlIDB4RkZDMjogeyAvLyBTT0YyIChTdGFydCBvZiBGcmFtZSwgUHJvZ3Jlc3NpdmUgRENUKVxyXG4gICAgICAgIHJlYWRVaW50MTYoKTsgLy8gc2tpcCBkYXRhIGxlbmd0aFxyXG4gICAgICAgIGZyYW1lID0ge1xyXG4gICAgICAgICAgZXh0ZW5kZWQ6IChmaWxlTWFya2VyID09PSAweEZGQzEpLFxyXG4gICAgICAgICAgcHJvZ3Jlc3NpdmU6IChmaWxlTWFya2VyID09PSAweEZGQzIpLFxyXG4gICAgICAgICAgcHJlY2lzaW9uOiBkYXRhW29mZnNldCsrXSxcclxuICAgICAgICAgIHNjYW5MaW5lczogcmVhZFVpbnQxNigpLFxyXG4gICAgICAgICAgc2FtcGxlc1BlckxpbmU6IHJlYWRVaW50MTYoKSxcclxuICAgICAgICAgIGNvbXBvbmVudHM6IHt9LFxyXG4gICAgICAgICAgY29tcG9uZW50c09yZGVyOiBbXSxcclxuICAgICAgICAgIG1heEg6IDAsXHJcbiAgICAgICAgICBtYXhWOiAwLFxyXG4gICAgICAgICAgbWN1c1BlckxpbmU6IDAsXHJcbiAgICAgICAgICBtY3VzUGVyQ29sdW1uOiAwLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHBpeGVsc0luRnJhbWUgPSBmcmFtZSEuc2NhbkxpbmVzICogZnJhbWUhLnNhbXBsZXNQZXJMaW5lO1xyXG4gICAgICAgIGlmIChwaXhlbHNJbkZyYW1lID4gbWF4UmVzb2x1dGlvbkluUGl4ZWxzKSB7XHJcbiAgICAgICAgICBjb25zdCBleGNlZWRlZEFtb3VudCA9IE1hdGguY2VpbCgocGl4ZWxzSW5GcmFtZSAtIG1heFJlc29sdXRpb25JblBpeGVscykgLyAxZTYpO1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtYXhSZXNvbHV0aW9uSW5NUCBsaW1pdCBleGNlZWRlZCBieSAke2V4Y2VlZGVkQW1vdW50fU1QYCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjb21wb25lbnRzQ291bnQgPSBkYXRhW29mZnNldCsrXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgY29uc3QgY29tcG9uZW50SWQgPSBkYXRhW29mZnNldF07XHJcbiAgICAgICAgICBjb25zdCBoID0gZGF0YVtvZmZzZXQgKyAxXSA+PiA0O1xyXG4gICAgICAgICAgY29uc3QgdiA9IGRhdGFbb2Zmc2V0ICsgMV0gJiAxNTtcclxuICAgICAgICAgIGNvbnN0IHFJZCA9IGRhdGFbb2Zmc2V0ICsgMl07XHJcbiAgICAgICAgICBmcmFtZSEuY29tcG9uZW50c09yZGVyLnB1c2goY29tcG9uZW50SWQpO1xyXG4gICAgICAgICAgZnJhbWUhLmNvbXBvbmVudHNbY29tcG9uZW50SWRdID0ge1xyXG4gICAgICAgICAgICBoOiBoLFxyXG4gICAgICAgICAgICB2OiB2LFxyXG4gICAgICAgICAgICBxdWFudGl6YXRpb25JZHg6IHFJZCxcclxuICAgICAgICAgICAgYmxvY2tzUGVyQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICBibG9ja3NQZXJMaW5lOiAwLFxyXG4gICAgICAgICAgICBibG9ja3M6IFtdLFxyXG4gICAgICAgICAgICBwcmVkOiAwLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIG9mZnNldCArPSAzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcmVwYXJlQ29tcG9uZW50cyhmcmFtZSEpO1xyXG4gICAgICAgIGZyYW1lcy5wdXNoKGZyYW1lKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICBjYXNlIDB4RkZDNDogey8vIERIVCAoRGVmaW5lIEh1ZmZtYW4gVGFibGVzKVxyXG4gICAgICAgIGNvbnN0IGh1ZmZtYW5MZW5ndGggPSByZWFkVWludDE2KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAyOyBpIDwgaHVmZm1hbkxlbmd0aDspIHtcclxuICAgICAgICAgIGNvbnN0IGh1ZmZtYW5UYWJsZVNwZWMgPSBkYXRhW29mZnNldCsrXTtcclxuICAgICAgICAgIGNvbnN0IGNvZGVMZW5ndGhzID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xyXG4gICAgICAgICAgbGV0IGNvZGVMZW5ndGhTdW0gPSAwO1xyXG5cclxuICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTY7IGorKywgb2Zmc2V0KyspIHtcclxuICAgICAgICAgICAgY29kZUxlbmd0aFN1bSArPSAoY29kZUxlbmd0aHNbal0gPSBkYXRhW29mZnNldF0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJlcXVlc3RNZW1vcnlBbGxvY2F0aW9uKDE2ICsgY29kZUxlbmd0aFN1bSk7XHJcbiAgICAgICAgICBjb25zdCBodWZmbWFuVmFsdWVzID0gbmV3IFVpbnQ4QXJyYXkoY29kZUxlbmd0aFN1bSk7XHJcblxyXG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb2RlTGVuZ3RoU3VtOyBqKyssIG9mZnNldCsrKSB7XHJcbiAgICAgICAgICAgIGh1ZmZtYW5WYWx1ZXNbal0gPSBkYXRhW29mZnNldF07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaSArPSAxNyArIGNvZGVMZW5ndGhTdW07XHJcblxyXG4gICAgICAgICAgY29uc3QgaW5kZXggPSBodWZmbWFuVGFibGVTcGVjICYgMTU7XHJcbiAgICAgICAgICBjb25zdCB0YWJsZSA9IChodWZmbWFuVGFibGVTcGVjID4+IDQpID09PSAwID8gaHVmZm1hblRhYmxlc0RDIDogaHVmZm1hblRhYmxlc0FDO1xyXG4gICAgICAgICAgdGFibGVbaW5kZXhdID0gYnVpbGRIdWZmbWFuVGFibGUoY29kZUxlbmd0aHMsIGh1ZmZtYW5WYWx1ZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICBjYXNlIDB4RkZERDogLy8gRFJJIChEZWZpbmUgUmVzdGFydCBJbnRlcnZhbClcclxuICAgICAgICByZWFkVWludDE2KCk7IC8vIHNraXAgZGF0YSBsZW5ndGhcclxuICAgICAgICByZXNldEludGVydmFsID0gcmVhZFVpbnQxNigpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIDB4RkZEQzogLy8gTnVtYmVyIG9mIExpbmVzIG1hcmtlclxyXG4gICAgICAgIHJlYWRVaW50MTYoKSAvLyBza2lwIGRhdGEgbGVuZ3RoXHJcbiAgICAgICAgcmVhZFVpbnQxNigpIC8vIElnbm9yZSB0aGlzIGRhdGEgc2luY2UgaXQgcmVwcmVzZW50cyB0aGUgaW1hZ2UgaGVpZ2h0XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgMHhGRkRBOiB7IC8vIFNPUyAoU3RhcnQgb2YgU2NhbilcclxuICAgICAgICByZWFkVWludDE2KCk7IC8vIHNraXAgZGF0YSBsZW5ndGhcclxuICAgICAgICBjb25zdCBzZWxlY3RvcnNDb3VudCA9IGRhdGFbb2Zmc2V0KytdO1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHM6IENvbXBvbmVudFtdID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RvcnNDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBmcmFtZSEuY29tcG9uZW50c1tkYXRhW29mZnNldCsrXV07XHJcbiAgICAgICAgICBjb25zdCB0YWJsZVNwZWMgPSBkYXRhW29mZnNldCsrXTtcclxuICAgICAgICAgIGNvbXBvbmVudC5odWZmbWFuVGFibGVEQyA9IGh1ZmZtYW5UYWJsZXNEQ1t0YWJsZVNwZWMgPj4gNF07XHJcbiAgICAgICAgICBjb21wb25lbnQuaHVmZm1hblRhYmxlQUMgPSBodWZmbWFuVGFibGVzQUNbdGFibGVTcGVjICYgMTVdO1xyXG4gICAgICAgICAgY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNwZWN0cmFsU3RhcnQgPSBkYXRhW29mZnNldCsrXTtcclxuICAgICAgICBjb25zdCBzcGVjdHJhbEVuZCA9IGRhdGFbb2Zmc2V0KytdO1xyXG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NpdmVBcHByb3hpbWF0aW9uID0gZGF0YVtvZmZzZXQrK107XHJcbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkID0gZGVjb2RlU2NhbihcclxuICAgICAgICAgIGRhdGEsIG9mZnNldCwgZnJhbWUhLCBjb21wb25lbnRzLCByZXNldEludGVydmFsLCBzcGVjdHJhbFN0YXJ0LCBzcGVjdHJhbEVuZCxcclxuICAgICAgICAgIHN1Y2Nlc3NpdmVBcHByb3hpbWF0aW9uID4+IDQsIHN1Y2Nlc3NpdmVBcHByb3hpbWF0aW9uICYgMTUpO1xyXG4gICAgICAgIG9mZnNldCArPSBwcm9jZXNzZWQ7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAweEZGRkY6IC8vIEZpbGwgYnl0ZXNcclxuICAgICAgICBpZiAoZGF0YVtvZmZzZXRdICE9PSAweEZGKSB7IC8vIEF2b2lkIHNraXBwaW5nIGEgdmFsaWQgbWFya2VyLlxyXG4gICAgICAgICAgb2Zmc2V0LS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgaWYgKGRhdGFbb2Zmc2V0IC0gM10gPT0gMHhGRiAmJiBkYXRhW29mZnNldCAtIDJdID49IDB4QzAgJiYgZGF0YVtvZmZzZXQgLSAyXSA8PSAweEZFKSB7XHJcbiAgICAgICAgICAvLyBjb3VsZCBiZSBpbmNvcnJlY3QgZW5jb2RpbmcgLS0gbGFzdCAweEZGIGJ5dGUgb2YgdGhlIHByZXZpb3VzXHJcbiAgICAgICAgICAvLyBibG9jayB3YXMgZWF0ZW4gYnkgdGhlIGVuY29kZXJcclxuICAgICAgICAgIG9mZnNldCAtPSAzO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmaWxlTWFya2VyID09PSAweEUwIHx8IGZpbGVNYXJrZXIgPT0gMHhFMSkge1xyXG4gICAgICAgICAgLy8gUmVjb3ZlciBmcm9tIG1hbGZvcm1lZCBBUFAxIG1hcmtlcnMgcG9wdWxhciBpbiBzb21lIHBob25lIG1vZGVscy5cclxuICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZXVnZW5ld2FyZS9qcGVnLWpzL2lzc3Vlcy84MlxyXG4gICAgICAgICAgaWYgKG1hbGZvcm1lZERhdGFPZmZzZXQgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmlyc3QgdW5rbm93biBKUEVHIG1hcmtlciBhdCBvZmZzZXQgJHttYWxmb3JtZWREYXRhT2Zmc2V0LnRvU3RyaW5nKDE2KX0sIHNlY29uZCB1bmtub3duIEpQRUcgbWFya2VyICR7ZmlsZU1hcmtlci50b1N0cmluZygxNil9IGF0IG9mZnNldCAkeyhvZmZzZXQgLSAxKS50b1N0cmluZygxNil9YCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBtYWxmb3JtZWREYXRhT2Zmc2V0ID0gb2Zmc2V0IC0gMTtcclxuICAgICAgICAgIGNvbnN0IG5leHRPZmZzZXQgPSByZWFkVWludDE2KCk7XHJcbiAgICAgICAgICBpZiAoZGF0YVtvZmZzZXQgKyBuZXh0T2Zmc2V0IC0gMl0gPT09IDB4RkYpIHtcclxuICAgICAgICAgICAgb2Zmc2V0ICs9IG5leHRPZmZzZXQgLSAyO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBKUEVHIG1hcmtlciAnICsgZmlsZU1hcmtlci50b1N0cmluZygxNikpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZmlsZU1hcmtlciA9IHJlYWRVaW50MTYoKTtcclxuICB9XHJcblxyXG4gIGlmIChmcmFtZXMubGVuZ3RoICE9IDEpIHRocm93IG5ldyBFcnJvcignb25seSBzaW5nbGUgZnJhbWUgSlBFR3Mgc3VwcG9ydGVkJyk7XHJcblxyXG4gIC8vIHNldCBlYWNoIGZyYW1lJ3MgY29tcG9uZW50cyBxdWFudGl6YXRpb24gdGFibGVcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgY29uc3QgY3AgPSBmcmFtZXNbaV0uY29tcG9uZW50cztcclxuICAgIGZvciAobGV0IGogaW4gY3ApIHsgLy8gVE9ETzogZG9uJ3QgdXNlIGBpbmBcclxuICAgICAgY3Bbal0ucXVhbnRpemF0aW9uVGFibGUgPSBxdWFudGl6YXRpb25UYWJsZXNbY3Bbal0ucXVhbnRpemF0aW9uSWR4IV07XHJcbiAgICAgIGRlbGV0ZSBjcFtqXS5xdWFudGl6YXRpb25JZHg7IC8vIFRPRE86IHdoeSA/Pz9cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNlbGYud2lkdGggPSBmcmFtZSEuc2FtcGxlc1BlckxpbmU7XHJcbiAgc2VsZi5oZWlnaHQgPSBmcmFtZSEuc2NhbkxpbmVzO1xyXG4gIHNlbGYuamZpZiA9IGpmaWY7XHJcbiAgc2VsZi5hZG9iZSA9IGFkb2JlO1xyXG4gIHNlbGYuY29tcG9uZW50cyA9IFtdO1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lIS5jb21wb25lbnRzT3JkZXIubGVuZ3RoOyBpKyspIHtcclxuICAgIGNvbnN0IGNvbXBvbmVudCA9IGZyYW1lIS5jb21wb25lbnRzW2ZyYW1lIS5jb21wb25lbnRzT3JkZXJbaV1dO1xyXG4gICAgc2VsZi5jb21wb25lbnRzLnB1c2goe1xyXG4gICAgICBsaW5lczogYnVpbGRDb21wb25lbnREYXRhKGNvbXBvbmVudCksXHJcbiAgICAgIHNjYWxlWDogY29tcG9uZW50LmggLyBmcmFtZSEubWF4SCxcclxuICAgICAgc2NhbGVZOiBjb21wb25lbnQudiAvIGZyYW1lIS5tYXhWXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzZWxmO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREYXRhKGRlY29kZWQ6IERlY29kZWQpIHtcclxuICBsZXQgb2Zmc2V0ID0gMDtcclxuICBsZXQgY29sb3JUcmFuc2Zvcm0gPSBmYWxzZTtcclxuXHJcbiAgY29uc3Qgd2lkdGggPSBkZWNvZGVkLndpZHRoO1xyXG4gIGNvbnN0IGhlaWdodCA9IGRlY29kZWQuaGVpZ2h0O1xyXG4gIGNvbnN0IGRhdGFMZW5ndGggPSB3aWR0aCAqIGhlaWdodCAqIGRlY29kZWQuY29tcG9uZW50cy5sZW5ndGg7XHJcbiAgcmVxdWVzdE1lbW9yeUFsbG9jYXRpb24oZGF0YUxlbmd0aCk7XHJcbiAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGRhdGFMZW5ndGgpO1xyXG5cclxuICBzd2l0Y2ggKGRlY29kZWQuY29tcG9uZW50cy5sZW5ndGgpIHtcclxuICAgIGNhc2UgMToge1xyXG4gICAgICBjb25zdCBjb21wb25lbnQxID0gZGVjb2RlZC5jb21wb25lbnRzWzBdO1xyXG5cclxuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDFMaW5lID0gY29tcG9uZW50MS5saW5lc1swIHwgKHkgKiBjb21wb25lbnQxLnNjYWxlWSldO1xyXG5cclxuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICAgIGNvbnN0IFkgPSBjb21wb25lbnQxTGluZVswIHwgKHggKiBjb21wb25lbnQxLnNjYWxlWCldO1xyXG4gICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSBZO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGNhc2UgMjoge1xyXG4gICAgICAvLyBQREYgbWlnaHQgY29tcHJlc3MgdHdvIGNvbXBvbmVudCBkYXRhIGluIGN1c3RvbSBjb2xvcnNwYWNlXHJcbiAgICAgIGNvbnN0IGNvbXBvbmVudDEgPSBkZWNvZGVkLmNvbXBvbmVudHNbMF07XHJcbiAgICAgIGNvbnN0IGNvbXBvbmVudDIgPSBkZWNvZGVkLmNvbXBvbmVudHNbMV07XHJcblxyXG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50MUxpbmUgPSBjb21wb25lbnQxLmxpbmVzWzAgfCAoeSAqIGNvbXBvbmVudDEuc2NhbGVZKV07XHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50MkxpbmUgPSBjb21wb25lbnQyLmxpbmVzWzAgfCAoeSAqIGNvbXBvbmVudDIuc2NhbGVZKV07XHJcblxyXG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xyXG4gICAgICAgICAgY29uc3QgWTEgPSBjb21wb25lbnQxTGluZVswIHwgKHggKiBjb21wb25lbnQxLnNjYWxlWCldO1xyXG4gICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSBZMTtcclxuICAgICAgICAgIGNvbnN0IFkyID0gY29tcG9uZW50MkxpbmVbMCB8ICh4ICogY29tcG9uZW50Mi5zY2FsZVgpXTtcclxuICAgICAgICAgIGRhdGFbb2Zmc2V0KytdID0gWTI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY2FzZSAzOiB7XHJcbiAgICAgIC8vIFRoZSBkZWZhdWx0IHRyYW5zZm9ybSBmb3IgdGhyZWUgY29tcG9uZW50cyBpcyB0cnVlXHJcbiAgICAgIGNvbG9yVHJhbnNmb3JtID0gdHJ1ZTtcclxuICAgICAgLy8gVGhlIGFkb2JlIHRyYW5zZm9ybSBtYXJrZXIgb3ZlcnJpZGVzIGFueSBwcmV2aW91cyBzZXR0aW5nXHJcbiAgICAgIGlmIChkZWNvZGVkLmFkb2JlICYmIGRlY29kZWQuYWRvYmUudHJhbnNmb3JtQ29kZSkgY29sb3JUcmFuc2Zvcm0gPSB0cnVlO1xyXG5cclxuICAgICAgY29uc3QgY29tcG9uZW50MSA9IGRlY29kZWQuY29tcG9uZW50c1swXTtcclxuICAgICAgY29uc3QgY29tcG9uZW50MiA9IGRlY29kZWQuY29tcG9uZW50c1sxXTtcclxuICAgICAgY29uc3QgY29tcG9uZW50MyA9IGRlY29kZWQuY29tcG9uZW50c1syXTtcclxuXHJcbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICBjb25zdCBjb21wb25lbnQxTGluZSA9IGNvbXBvbmVudDEubGluZXNbMCB8ICh5ICogY29tcG9uZW50MS5zY2FsZVkpXTtcclxuICAgICAgICBjb25zdCBjb21wb25lbnQyTGluZSA9IGNvbXBvbmVudDIubGluZXNbMCB8ICh5ICogY29tcG9uZW50Mi5zY2FsZVkpXTtcclxuICAgICAgICBjb25zdCBjb21wb25lbnQzTGluZSA9IGNvbXBvbmVudDMubGluZXNbMCB8ICh5ICogY29tcG9uZW50My5zY2FsZVkpXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgICBsZXQgWSwgQ2IsIENyLCBSLCBHLCBCO1xyXG5cclxuICAgICAgICAgIGlmICghY29sb3JUcmFuc2Zvcm0pIHtcclxuICAgICAgICAgICAgUiA9IGNvbXBvbmVudDFMaW5lWzAgfCAoeCAqIGNvbXBvbmVudDEuc2NhbGVYKV07XHJcbiAgICAgICAgICAgIEcgPSBjb21wb25lbnQyTGluZVswIHwgKHggKiBjb21wb25lbnQyLnNjYWxlWCldO1xyXG4gICAgICAgICAgICBCID0gY29tcG9uZW50M0xpbmVbMCB8ICh4ICogY29tcG9uZW50My5zY2FsZVgpXTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIFkgPSBjb21wb25lbnQxTGluZVswIHwgKHggKiBjb21wb25lbnQxLnNjYWxlWCldO1xyXG4gICAgICAgICAgICBDYiA9IGNvbXBvbmVudDJMaW5lWzAgfCAoeCAqIGNvbXBvbmVudDIuc2NhbGVYKV07XHJcbiAgICAgICAgICAgIENyID0gY29tcG9uZW50M0xpbmVbMCB8ICh4ICogY29tcG9uZW50My5zY2FsZVgpXTtcclxuXHJcbiAgICAgICAgICAgIFIgPSBjbGFtcFRvOGJpdChZICsgMS40MDIgKiAoQ3IgLSAxMjgpKTtcclxuICAgICAgICAgICAgRyA9IGNsYW1wVG84Yml0KFkgLSAwLjM0NDEzNjMgKiAoQ2IgLSAxMjgpIC0gMC43MTQxMzYzNiAqIChDciAtIDEyOCkpO1xyXG4gICAgICAgICAgICBCID0gY2xhbXBUbzhiaXQoWSArIDEuNzcyICogKENiIC0gMTI4KSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSBSO1xyXG4gICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSBHO1xyXG4gICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSBCO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGNhc2UgNDoge1xyXG4gICAgICBpZiAoIWRlY29kZWQuYWRvYmUpIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgY29sb3IgbW9kZSAoNCBjb21wb25lbnRzKScpO1xyXG4gICAgICAvLyBUaGUgZGVmYXVsdCB0cmFuc2Zvcm0gZm9yIGZvdXIgY29tcG9uZW50cyBpcyBmYWxzZVxyXG4gICAgICBjb2xvclRyYW5zZm9ybSA9IGZhbHNlO1xyXG4gICAgICAvLyBUaGUgYWRvYmUgdHJhbnNmb3JtIG1hcmtlciBvdmVycmlkZXMgYW55IHByZXZpb3VzIHNldHRpbmdcclxuICAgICAgaWYgKGRlY29kZWQuYWRvYmUgJiYgZGVjb2RlZC5hZG9iZS50cmFuc2Zvcm1Db2RlKSBjb2xvclRyYW5zZm9ybSA9IHRydWU7XHJcblxyXG4gICAgICBjb25zdCBjb21wb25lbnQxID0gZGVjb2RlZC5jb21wb25lbnRzWzBdO1xyXG4gICAgICBjb25zdCBjb21wb25lbnQyID0gZGVjb2RlZC5jb21wb25lbnRzWzFdO1xyXG4gICAgICBjb25zdCBjb21wb25lbnQzID0gZGVjb2RlZC5jb21wb25lbnRzWzJdO1xyXG4gICAgICBjb25zdCBjb21wb25lbnQ0ID0gZGVjb2RlZC5jb21wb25lbnRzWzNdO1xyXG5cclxuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDFMaW5lID0gY29tcG9uZW50MS5saW5lc1swIHwgKHkgKiBjb21wb25lbnQxLnNjYWxlWSldO1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDJMaW5lID0gY29tcG9uZW50Mi5saW5lc1swIHwgKHkgKiBjb21wb25lbnQyLnNjYWxlWSldO1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDNMaW5lID0gY29tcG9uZW50My5saW5lc1swIHwgKHkgKiBjb21wb25lbnQzLnNjYWxlWSldO1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDRMaW5lID0gY29tcG9uZW50NC5saW5lc1swIHwgKHkgKiBjb21wb25lbnQ0LnNjYWxlWSldO1xyXG5cclxuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICAgIGxldCBZLCBDYiwgQ3IsIEssIEMsIE0sIFllO1xyXG5cclxuICAgICAgICAgIGlmICghY29sb3JUcmFuc2Zvcm0pIHtcclxuICAgICAgICAgICAgQyA9IGNvbXBvbmVudDFMaW5lWzAgfCAoeCAqIGNvbXBvbmVudDEuc2NhbGVYKV07XHJcbiAgICAgICAgICAgIE0gPSBjb21wb25lbnQyTGluZVswIHwgKHggKiBjb21wb25lbnQyLnNjYWxlWCldO1xyXG4gICAgICAgICAgICBZZSA9IGNvbXBvbmVudDNMaW5lWzAgfCAoeCAqIGNvbXBvbmVudDMuc2NhbGVYKV07XHJcbiAgICAgICAgICAgIEsgPSBjb21wb25lbnQ0TGluZVswIHwgKHggKiBjb21wb25lbnQ0LnNjYWxlWCldO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgWSA9IGNvbXBvbmVudDFMaW5lWzAgfCAoeCAqIGNvbXBvbmVudDEuc2NhbGVYKV07XHJcbiAgICAgICAgICAgIENiID0gY29tcG9uZW50MkxpbmVbMCB8ICh4ICogY29tcG9uZW50Mi5zY2FsZVgpXTtcclxuICAgICAgICAgICAgQ3IgPSBjb21wb25lbnQzTGluZVswIHwgKHggKiBjb21wb25lbnQzLnNjYWxlWCldO1xyXG4gICAgICAgICAgICBLID0gY29tcG9uZW50NExpbmVbMCB8ICh4ICogY29tcG9uZW50NC5zY2FsZVgpXTtcclxuXHJcbiAgICAgICAgICAgIEMgPSAyNTUgLSBjbGFtcFRvOGJpdChZICsgMS40MDIgKiAoQ3IgLSAxMjgpKTtcclxuICAgICAgICAgICAgTSA9IDI1NSAtIGNsYW1wVG84Yml0KFkgLSAwLjM0NDEzNjMgKiAoQ2IgLSAxMjgpIC0gMC43MTQxMzYzNiAqIChDciAtIDEyOCkpO1xyXG4gICAgICAgICAgICBZZSA9IDI1NSAtIGNsYW1wVG84Yml0KFkgKyAxLjc3MiAqIChDYiAtIDEyOCkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSAyNTUgLSBDO1xyXG4gICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSAyNTUgLSBNO1xyXG4gICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSAyNTUgLSBZZTtcclxuICAgICAgICAgIGRhdGFbb2Zmc2V0KytdID0gMjU1IC0gSztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGNvbG9yIG1vZGUnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBkYXRhO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlSnBlZyhlbmNvZGVkOiBVaW50OEFycmF5LCBjcmVhdGVJbWFnZURhdGE6ICh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikgPT4gSW1hZ2VEYXRhKSB7XHJcbiAgdG90YWxCeXRlc0FsbG9jYXRlZCA9IDA7XHJcblxyXG4gIGlmIChlbmNvZGVkLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKCdFbXB0eSBqcGVnIGJ1ZmZlcicpO1xyXG5cclxuICBjb25zdCBkZWNvZGVkID0gcGFyc2UoZW5jb2RlZCk7XHJcbiAgcmVxdWVzdE1lbW9yeUFsbG9jYXRpb24oZGVjb2RlZC53aWR0aCAqIGRlY29kZWQuaGVpZ2h0ICogNCk7XHJcblxyXG4gIGNvbnN0IGRhdGEgPSBnZXREYXRhKGRlY29kZWQpO1xyXG5cclxuICBjb25zdCBpbWFnZURhdGEgPSBjcmVhdGVJbWFnZURhdGEoZGVjb2RlZC53aWR0aCwgZGVjb2RlZC5oZWlnaHQpO1xyXG4gIGNvbnN0IHdpZHRoID0gaW1hZ2VEYXRhLndpZHRoO1xyXG4gIGNvbnN0IGhlaWdodCA9IGltYWdlRGF0YS5oZWlnaHQ7XHJcbiAgY29uc3QgaW1hZ2VEYXRhQXJyYXkgPSBpbWFnZURhdGEuZGF0YTtcclxuXHJcbiAgbGV0IGkgPSAwO1xyXG4gIGxldCBqID0gMDtcclxuXHJcbiAgc3dpdGNoIChkZWNvZGVkLmNvbXBvbmVudHMubGVuZ3RoKSB7XHJcbiAgICBjYXNlIDE6XHJcbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICAgIGNvbnN0IFkgPSBkYXRhW2krK107XHJcblxyXG4gICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IFk7XHJcbiAgICAgICAgICBpbWFnZURhdGFBcnJheVtqKytdID0gWTtcclxuICAgICAgICAgIGltYWdlRGF0YUFycmF5W2orK10gPSBZO1xyXG4gICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IDI1NTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDM6XHJcbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICAgIGNvbnN0IFIgPSBkYXRhW2krK107XHJcbiAgICAgICAgICBjb25zdCBHID0gZGF0YVtpKytdO1xyXG4gICAgICAgICAgY29uc3QgQiA9IGRhdGFbaSsrXTtcclxuXHJcbiAgICAgICAgICBpbWFnZURhdGFBcnJheVtqKytdID0gUjtcclxuICAgICAgICAgIGltYWdlRGF0YUFycmF5W2orK10gPSBHO1xyXG4gICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IEI7XHJcbiAgICAgICAgICBpbWFnZURhdGFBcnJheVtqKytdID0gMjU1O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgNDpcclxuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xyXG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xyXG4gICAgICAgICAgY29uc3QgQyA9IGRhdGFbaSsrXTtcclxuICAgICAgICAgIGNvbnN0IE0gPSBkYXRhW2krK107XHJcbiAgICAgICAgICBjb25zdCBZID0gZGF0YVtpKytdO1xyXG4gICAgICAgICAgY29uc3QgSyA9IGRhdGFbaSsrXTtcclxuXHJcbiAgICAgICAgICBjb25zdCBSID0gMjU1IC0gY2xhbXBUbzhiaXQoQyAqICgxIC0gSyAvIDI1NSkgKyBLKTtcclxuICAgICAgICAgIGNvbnN0IEcgPSAyNTUgLSBjbGFtcFRvOGJpdChNICogKDEgLSBLIC8gMjU1KSArIEspO1xyXG4gICAgICAgICAgY29uc3QgQiA9IDI1NSAtIGNsYW1wVG84Yml0KFkgKiAoMSAtIEsgLyAyNTUpICsgSyk7XHJcblxyXG4gICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IFI7XHJcbiAgICAgICAgICBpbWFnZURhdGFBcnJheVtqKytdID0gRztcclxuICAgICAgICAgIGltYWdlRGF0YUFycmF5W2orK10gPSBCO1xyXG4gICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IDI1NTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGNvbG9yIG1vZGUnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBpbWFnZURhdGE7XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiJDOlxcUHJvamVjdHNcXGdpdGh1YlxcYWctcHNkXFxzcmMifQ==
