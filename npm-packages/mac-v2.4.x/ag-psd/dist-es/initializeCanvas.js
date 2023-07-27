import { createCanvas } from 'canvas';
import { initializeCanvas } from './index';
import { decodeJpeg } from './jpeg';
function createCanvasFromData(data) {
    var canvas = createCanvas(100, 100);
    try {
        var context_1 = canvas.getContext('2d');
        var imageData = decodeJpeg(data, function (w, h) { return context_1.createImageData(w, h); });
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        context_1.putImageData(imageData, 0, 0);
    }
    catch (e) {
        console.error('JPEG decompression error', e.message);
    }
    return canvas;
}
initializeCanvas(createCanvas, createCanvasFromData);
export function initialize() {
    initializeCanvas(createCanvas, createCanvasFromData);
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXRpYWxpemVDYW52YXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUN0QyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDM0MsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUVwQyxTQUFTLG9CQUFvQixDQUFDLElBQWdCO0lBQzdDLElBQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFdEMsSUFBSTtRQUNILElBQU0sU0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFFLENBQUM7UUFDekMsSUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFDLENBQUMsRUFBRSxDQUFDLElBQUssT0FBQSxTQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBN0IsQ0FBNkIsQ0FBQyxDQUFDO1FBQzVFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztRQUMvQixNQUFNLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDakMsU0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3RDO0lBQUMsT0FBTyxDQUFNLEVBQUU7UUFDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDckQ7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUM7QUFFRCxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztBQUVyRCxNQUFNLFVBQVUsVUFBVTtJQUN6QixnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztBQUN0RCxDQUFDIiwiZmlsZSI6ImluaXRpYWxpemVDYW52YXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDYW52YXMgfSBmcm9tICdjYW52YXMnO1xyXG5pbXBvcnQgeyBpbml0aWFsaXplQ2FudmFzIH0gZnJvbSAnLi9pbmRleCc7XHJcbmltcG9ydCB7IGRlY29kZUpwZWcgfSBmcm9tICcuL2pwZWcnO1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlQ2FudmFzRnJvbURhdGEoZGF0YTogVWludDhBcnJheSkge1xyXG5cdGNvbnN0IGNhbnZhcyA9IGNyZWF0ZUNhbnZhcygxMDAsIDEwMCk7XHJcblxyXG5cdHRyeSB7XHJcblx0XHRjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xyXG5cdFx0Y29uc3QgaW1hZ2VEYXRhID0gZGVjb2RlSnBlZyhkYXRhLCAodywgaCkgPT4gY29udGV4dC5jcmVhdGVJbWFnZURhdGEodywgaCkpO1xyXG5cdFx0Y2FudmFzLndpZHRoID0gaW1hZ2VEYXRhLndpZHRoO1xyXG5cdFx0Y2FudmFzLmhlaWdodCA9IGltYWdlRGF0YS5oZWlnaHQ7XHJcblx0XHRjb250ZXh0LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xyXG5cdH0gY2F0Y2ggKGU6IGFueSkge1xyXG5cdFx0Y29uc29sZS5lcnJvcignSlBFRyBkZWNvbXByZXNzaW9uIGVycm9yJywgZS5tZXNzYWdlKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBjYW52YXM7XHJcbn1cclxuXHJcbmluaXRpYWxpemVDYW52YXMoY3JlYXRlQ2FudmFzLCBjcmVhdGVDYW52YXNGcm9tRGF0YSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuXHRpbml0aWFsaXplQ2FudmFzKGNyZWF0ZUNhbnZhcywgY3JlYXRlQ2FudmFzRnJvbURhdGEpO1xyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiQzpcXFByb2plY3RzXFxnaXRodWJcXGFnLXBzZFxcc3JjIn0=
