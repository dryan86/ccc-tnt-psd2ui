cmd_Release/obj.target/canvas/src/CanvasRenderingContext2d.o := c++ -o Release/obj.target/canvas/src/CanvasRenderingContext2d.o ../src/CanvasRenderingContext2d.cc '-DNODE_GYP_MODULE_NAME=canvas' '-DUSING_UV_SHARED=1' '-DUSING_V8_SHARED=1' '-DV8_DEPRECATION_WARNINGS=1' '-DV8_DEPRECATION_WARNINGS' '-DV8_IMMINENT_DEPRECATION_WARNINGS' '-D_GLIBCXX_USE_CXX11_ABI=1' '-D_DARWIN_USE_64_BIT_INODE=1' '-D_LARGEFILE_SOURCE' '-D_FILE_OFFSET_BITS=64' '-DOPENSSL_NO_PINSHARED' '-DOPENSSL_THREADS' '-DHAVE_JPEG' '-DHAVE_GIF' '-DHAVE_RSVG' '-DBUILDING_NODE_EXTENSION' -I/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node -I/Users/wsl/Library/Caches/node-gyp/16.14.0/src -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/openssl/config -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/openssl/openssl/include -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/uv/include -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/zlib -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/v8/include -I../../nan -I/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo -I/opt/homebrew/Cellar/glib/2.74.0/include -I/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0 -I/opt/homebrew/Cellar/glib/2.74.0/lib/glib-2.0/include -I/opt/homebrew/opt/gettext/include -I/opt/homebrew/Cellar/pcre2/10.40/include -I/opt/homebrew/Cellar/pixman/0.40.0/include/pixman-1 -I/opt/homebrew/Cellar/fontconfig/2.14.1/include -I/opt/homebrew/opt/freetype/include/freetype2 -I/opt/homebrew/Cellar/libpng/1.6.38/include/libpng16 -I/opt/homebrew/Cellar/libxcb/1.15/include -I/opt/homebrew/Cellar/libxrender/0.9.10/include -I/opt/homebrew/Cellar/libxext/1.3.5/include -I/opt/homebrew/Cellar/libx11/1.8.2/include -I/opt/homebrew/Cellar/libxau/1.0.10/include -I/opt/homebrew/Cellar/libxdmcp/1.1.3/include -I/opt/homebrew/Cellar/xorgproto/2022.2/include -I/Library/Developer/CommandLineTools/SDKs/MacOSX12.sdk/usr/include/ffi -I/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0 -I/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz -I/opt/homebrew/Cellar/fribidi/1.0.12/include/fribidi -I/opt/homebrew/Cellar/graphite2/1.3.14/include -I/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include -I/opt/homebrew/include -I/opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0 -I/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0 -I/opt/homebrew/Cellar/libtiff/4.4.0_1/include  -O3 -gdwarf-2 -mmacosx-version-min=10.13 -arch arm64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++14 -stdlib=libc++ -fno-rtti -fno-strict-aliasing -MMD -MF ./Release/.deps/Release/obj.target/canvas/src/CanvasRenderingContext2d.o.d.raw   -c
Release/obj.target/canvas/src/CanvasRenderingContext2d.o: \
  ../src/CanvasRenderingContext2d.cc ../src/CanvasRenderingContext2d.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-version.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-features.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-deprecated.h \
  ../src/Canvas.h ../src/backend/Backend.h \
  ../src/backend/../dll_visibility.h ../../nan/nan.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/node_version.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/errno.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/version.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/unix.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/threadpool.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/darwin.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/node.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/cppgc/common.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8config.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8-internal.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8-version.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8-platform.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/node_buffer.h \
  /Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/node_object_wrap.h \
  ../../nan/nan_callbacks.h ../../nan/nan_callbacks_12_inl.h \
  ../../nan/nan_maybe_43_inl.h ../../nan/nan_converters.h \
  ../../nan/nan_converters_43_inl.h ../../nan/nan_new.h \
  ../../nan/nan_implementation_12_inl.h \
  ../../nan/nan_persistent_12_inl.h ../../nan/nan_weak.h \
  ../../nan/nan_object_wrap.h ../../nan/nan_private.h \
  ../../nan/nan_typedarray_contents.h ../../nan/nan_json.h \
  ../../nan/nan_scriptorigin.h ../src/dll_visibility.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pangocairo.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-attributes.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-font.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-coverage.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib-object.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gbinding.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/galloca.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtypes.h \
  /opt/homebrew/Cellar/glib/2.74.0/lib/glib-2.0/include/glibconfig.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmacros.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gversionmacros.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/garray.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gasyncqueue.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gthread.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gatomic.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/glib-typeof.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gerror.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gquark.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gutils.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbacktrace.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbase64.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbitlock.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbookmarkfile.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gdatetime.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtimezone.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbytes.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gcharset.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gchecksum.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gconvert.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gdataset.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gdate.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gdir.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/genviron.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gfileutils.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ggettext.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ghash.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/glist.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmem.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gnode.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ghmac.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ghook.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ghostutils.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/giochannel.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmain.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gpoll.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gslist.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gstring.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gunicode.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gkeyfile.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmappedfile.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmarkup.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmessages.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gvariant.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gvarianttype.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/goption.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gpattern.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gprimes.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gqsort.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gqueue.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/grand.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/grcbox.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/grefcount.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/grefstring.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gregex.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gscanner.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gsequence.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gshell.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gslice.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gspawn.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gstrfuncs.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gstringchunk.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gstrvbuilder.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtestutils.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gthreadpool.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtimer.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtrashstack.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtree.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/guri.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/guuid.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gversion.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gallocator.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gcache.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gcompletion.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gmain.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/grel.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gthread.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/glib-autocleanups.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gobject.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gtype.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gvalue.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gparam.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gclosure.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gsignal.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gmarshal.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gboxed.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/glib-types.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gbindinggroup.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/genums.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/glib-enumtypes.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gparamspecs.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gsignalgroup.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gsourceclosure.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gtypemodule.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gtypeplugin.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gvaluearray.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gvaluetypes.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gobject-autocleanups.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-version-macros.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-features.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-blob.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-common.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-buffer.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-unicode.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-font.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-face.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-set.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-draw.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-deprecated.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-map.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-shape.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-shape-plan.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-style.h \
  /opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-version.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-types.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-gravity.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-matrix.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-script.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-language.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-bidi-type.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-direction.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-color.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-break.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-item.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-context.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-fontmap.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-fontset.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-engine.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-glyph.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-enum-types.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-fontset-simple.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-glyph-item.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-layout.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-tabs.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-markup.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-renderer.h \
  /opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-utils.h \
  ../src/color.h ../src/backend/ImageBackend.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-pdf.h \
  ../src/CanvasGradient.h ../src/CanvasPattern.h ../src/Image.h \
  ../src/CanvasError.h \
  /opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jpeglib.h \
  /opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jconfig.h \
  /opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jmorecfg.h \
  /opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jerror.h \
  /opt/homebrew/include/gif_lib.h \
  /opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0/librsvg/rsvg.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gio.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/giotypes.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gioenums.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gaction.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gactiongroup.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gactiongroupexporter.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gactionmap.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gappinfo.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gapplication.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gapplicationcommandline.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gasyncinitable.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginitable.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gasyncresult.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gbufferedinputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfilterinputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gbufferedoutputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfilteroutputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/goutputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gbytesicon.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gcancellable.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gcharsetconverter.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gconverter.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gcontenttype.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gconverterinputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gconverteroutputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gcredentials.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdatagrambased.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdatainputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdataoutputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusactiongroup.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusaddress.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusauthobserver.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbuserror.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusinterface.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusinterfaceskeleton.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusintrospection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusmenumodel.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusmessage.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusmethodinvocation.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusnameowning.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusnamewatching.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobject.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectmanager.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectmanagerclient.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectmanagerserver.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectproxy.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectskeleton.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusproxy.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusserver.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusutils.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdebugcontroller.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdebugcontrollerdbus.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdrive.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdtlsclientconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdtlsconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdtlsserverconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gemblemedicon.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gicon.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gemblem.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfile.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileattribute.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileenumerator.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileicon.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileinfo.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileinputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileiostream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/giostream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gioerror.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfilemonitor.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfilenamecompleter.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileoutputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginetaddress.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginetaddressmask.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginetsocketaddress.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketaddress.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gioenumtypes.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/giomodule.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gmodule.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gioscheduler.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/glistmodel.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gliststore.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gloadableicon.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmemoryinputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmemorymonitor.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmemoryoutputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmenu.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmenumodel.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmenuexporter.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmount.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmountoperation.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnativesocketaddress.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnativevolumemonitor.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gvolumemonitor.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnetworkaddress.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnetworkmonitor.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnetworkservice.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnotification.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpermission.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpollableinputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpollableoutputstream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpollableutils.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpowerprofilemonitor.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpropertyaction.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gproxy.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gproxyaddress.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gproxyaddressenumerator.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketaddressenumerator.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gproxyresolver.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gremoteactiongroup.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gresolver.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gresource.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gseekable.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsettings.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsettingsschema.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleaction.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleactiongroup.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleasyncresult.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleiostream.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimplepermission.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleproxyresolver.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocket.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketclient.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketconnectable.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketcontrolmessage.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketlistener.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketservice.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsrvtarget.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsubprocess.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsubprocesslauncher.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtask.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtcpconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtcpwrapperconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtestdbus.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gthemedicon.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gthreadedsocketservice.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsbackend.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlscertificate.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsclientconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsdatabase.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsfiledatabase.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsinteraction.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlspassword.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsserverconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gunixconnection.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gunixcredentialsmessage.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gunixfdlist.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gunixsocketaddress.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gvfs.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gvolume.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gzlibcompressor.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gzlibdecompressor.h \
  /opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gio-autocleanups.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-macros.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-features.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-core.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-transform.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-animation.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-simple-anim.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-io.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-loader.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-enum-types.h \
  /opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-autocleanups.h \
  /opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0/librsvg/rsvg-features.h \
  /opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0/librsvg/rsvg-version.h \
  /opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0/librsvg/rsvg-cairo.h \
  ../src/ImageData.h ../src/Point.h ../src/Util.h
../src/CanvasRenderingContext2d.cc:
../src/CanvasRenderingContext2d.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-version.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-features.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-deprecated.h:
../src/Canvas.h:
../src/backend/Backend.h:
../src/backend/../dll_visibility.h:
../../nan/nan.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/node_version.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/errno.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/version.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/unix.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/threadpool.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/uv/darwin.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/node.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/cppgc/common.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8config.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8-internal.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8-version.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/v8-platform.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/node_buffer.h:
/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node/node_object_wrap.h:
../../nan/nan_callbacks.h:
../../nan/nan_callbacks_12_inl.h:
../../nan/nan_maybe_43_inl.h:
../../nan/nan_converters.h:
../../nan/nan_converters_43_inl.h:
../../nan/nan_new.h:
../../nan/nan_implementation_12_inl.h:
../../nan/nan_persistent_12_inl.h:
../../nan/nan_weak.h:
../../nan/nan_object_wrap.h:
../../nan/nan_private.h:
../../nan/nan_typedarray_contents.h:
../../nan/nan_json.h:
../../nan/nan_scriptorigin.h:
../src/dll_visibility.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pangocairo.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-attributes.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-font.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-coverage.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib-object.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gbinding.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/galloca.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtypes.h:
/opt/homebrew/Cellar/glib/2.74.0/lib/glib-2.0/include/glibconfig.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmacros.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gversionmacros.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/garray.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gasyncqueue.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gthread.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gatomic.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/glib-typeof.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gerror.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gquark.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gutils.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbacktrace.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbase64.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbitlock.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbookmarkfile.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gdatetime.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtimezone.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gbytes.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gcharset.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gchecksum.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gconvert.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gdataset.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gdate.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gdir.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/genviron.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gfileutils.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ggettext.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ghash.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/glist.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmem.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gnode.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ghmac.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ghook.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/ghostutils.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/giochannel.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmain.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gpoll.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gslist.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gstring.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gunicode.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gkeyfile.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmappedfile.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmarkup.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gmessages.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gvariant.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gvarianttype.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/goption.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gpattern.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gprimes.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gqsort.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gqueue.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/grand.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/grcbox.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/grefcount.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/grefstring.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gregex.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gscanner.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gsequence.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gshell.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gslice.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gspawn.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gstrfuncs.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gstringchunk.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gstrvbuilder.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtestutils.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gthreadpool.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtimer.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtrashstack.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gtree.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/guri.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/guuid.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/gversion.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gallocator.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gcache.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gcompletion.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gmain.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/grel.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/deprecated/gthread.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/glib/glib-autocleanups.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gobject.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gtype.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gvalue.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gparam.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gclosure.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gsignal.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gmarshal.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gboxed.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/glib-types.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gbindinggroup.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/genums.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/glib-enumtypes.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gparamspecs.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gsignalgroup.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gsourceclosure.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gtypemodule.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gtypeplugin.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gvaluearray.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gvaluetypes.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gobject/gobject-autocleanups.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-version-macros.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-features.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-blob.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-common.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-buffer.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-unicode.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-font.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-face.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-set.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-draw.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-deprecated.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-map.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-shape.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-shape-plan.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-style.h:
/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz/hb-version.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-types.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-gravity.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-matrix.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-script.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-language.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-bidi-type.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-direction.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-color.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-break.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-item.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-context.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-fontmap.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-fontset.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-engine.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-glyph.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-enum-types.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-fontset-simple.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-glyph-item.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-layout.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-tabs.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-markup.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-renderer.h:
/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0/pango/pango-utils.h:
../src/color.h:
../src/backend/ImageBackend.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-pdf.h:
../src/CanvasGradient.h:
../src/CanvasPattern.h:
../src/Image.h:
../src/CanvasError.h:
/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jpeglib.h:
/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jconfig.h:
/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jmorecfg.h:
/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jerror.h:
/opt/homebrew/include/gif_lib.h:
/opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0/librsvg/rsvg.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gio.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/giotypes.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gioenums.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gaction.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gactiongroup.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gactiongroupexporter.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gactionmap.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gappinfo.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gapplication.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gapplicationcommandline.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gasyncinitable.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginitable.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gasyncresult.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gbufferedinputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfilterinputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gbufferedoutputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfilteroutputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/goutputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gbytesicon.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gcancellable.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gcharsetconverter.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gconverter.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gcontenttype.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gconverterinputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gconverteroutputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gcredentials.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdatagrambased.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdatainputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdataoutputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusactiongroup.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusaddress.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusauthobserver.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbuserror.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusinterface.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusinterfaceskeleton.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusintrospection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusmenumodel.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusmessage.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusmethodinvocation.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusnameowning.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusnamewatching.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobject.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectmanager.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectmanagerclient.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectmanagerserver.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectproxy.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusobjectskeleton.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusproxy.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusserver.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdbusutils.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdebugcontroller.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdebugcontrollerdbus.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdrive.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdtlsclientconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdtlsconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gdtlsserverconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gemblemedicon.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gicon.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gemblem.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfile.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileattribute.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileenumerator.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileicon.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileinfo.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileinputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileiostream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/giostream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gioerror.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfilemonitor.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfilenamecompleter.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gfileoutputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginetaddress.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginetaddressmask.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/ginetsocketaddress.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketaddress.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gioenumtypes.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/giomodule.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gmodule.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gioscheduler.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/glistmodel.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gliststore.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gloadableicon.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmemoryinputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmemorymonitor.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmemoryoutputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmenu.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmenumodel.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmenuexporter.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmount.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gmountoperation.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnativesocketaddress.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnativevolumemonitor.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gvolumemonitor.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnetworkaddress.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnetworkmonitor.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnetworkservice.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gnotification.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpermission.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpollableinputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpollableoutputstream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpollableutils.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpowerprofilemonitor.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gpropertyaction.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gproxy.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gproxyaddress.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gproxyaddressenumerator.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketaddressenumerator.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gproxyresolver.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gremoteactiongroup.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gresolver.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gresource.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gseekable.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsettings.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsettingsschema.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleaction.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleactiongroup.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleasyncresult.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleiostream.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimplepermission.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsimpleproxyresolver.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocket.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketclient.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketconnectable.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketcontrolmessage.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketlistener.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsocketservice.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsrvtarget.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsubprocess.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gsubprocesslauncher.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtask.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtcpconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtcpwrapperconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtestdbus.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gthemedicon.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gthreadedsocketservice.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsbackend.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlscertificate.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsclientconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsdatabase.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsfiledatabase.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsinteraction.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlspassword.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gtlsserverconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gunixconnection.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gunixcredentialsmessage.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gunixfdlist.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gunixsocketaddress.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gvfs.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gvolume.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gzlibcompressor.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gzlibdecompressor.h:
/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0/gio/gio-autocleanups.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-macros.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-features.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-core.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-transform.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-animation.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-simple-anim.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-io.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-loader.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-enum-types.h:
/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0/gdk-pixbuf/gdk-pixbuf-autocleanups.h:
/opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0/librsvg/rsvg-features.h:
/opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0/librsvg/rsvg-version.h:
/opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0/librsvg/rsvg-cairo.h:
../src/ImageData.h:
../src/Point.h:
../src/Util.h:
