cmd_Release/obj.target/canvas/src/closure.o := c++ -o Release/obj.target/canvas/src/closure.o ../src/closure.cc '-DNODE_GYP_MODULE_NAME=canvas' '-DUSING_UV_SHARED=1' '-DUSING_V8_SHARED=1' '-DV8_DEPRECATION_WARNINGS=1' '-DV8_DEPRECATION_WARNINGS' '-DV8_IMMINENT_DEPRECATION_WARNINGS' '-D_GLIBCXX_USE_CXX11_ABI=1' '-D_DARWIN_USE_64_BIT_INODE=1' '-D_LARGEFILE_SOURCE' '-D_FILE_OFFSET_BITS=64' '-DOPENSSL_NO_PINSHARED' '-DOPENSSL_THREADS' '-DHAVE_JPEG' '-DHAVE_GIF' '-DHAVE_RSVG' '-DBUILDING_NODE_EXTENSION' -I/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node -I/Users/wsl/Library/Caches/node-gyp/16.14.0/src -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/openssl/config -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/openssl/openssl/include -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/uv/include -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/zlib -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/v8/include -I../../nan -I/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo -I/opt/homebrew/Cellar/glib/2.74.0/include -I/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0 -I/opt/homebrew/Cellar/glib/2.74.0/lib/glib-2.0/include -I/opt/homebrew/opt/gettext/include -I/opt/homebrew/Cellar/pcre2/10.40/include -I/opt/homebrew/Cellar/pixman/0.40.0/include/pixman-1 -I/opt/homebrew/Cellar/fontconfig/2.14.1/include -I/opt/homebrew/opt/freetype/include/freetype2 -I/opt/homebrew/Cellar/libpng/1.6.38/include/libpng16 -I/opt/homebrew/Cellar/libxcb/1.15/include -I/opt/homebrew/Cellar/libxrender/0.9.10/include -I/opt/homebrew/Cellar/libxext/1.3.5/include -I/opt/homebrew/Cellar/libx11/1.8.2/include -I/opt/homebrew/Cellar/libxau/1.0.10/include -I/opt/homebrew/Cellar/libxdmcp/1.1.3/include -I/opt/homebrew/Cellar/xorgproto/2022.2/include -I/Library/Developer/CommandLineTools/SDKs/MacOSX12.sdk/usr/include/ffi -I/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0 -I/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz -I/opt/homebrew/Cellar/fribidi/1.0.12/include/fribidi -I/opt/homebrew/Cellar/graphite2/1.3.14/include -I/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include -I/opt/homebrew/include -I/opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0 -I/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0 -I/opt/homebrew/Cellar/libtiff/4.4.0_1/include  -O3 -gdwarf-2 -mmacosx-version-min=10.13 -arch arm64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++14 -stdlib=libc++ -fno-rtti -fno-strict-aliasing -MMD -MF ./Release/.deps/Release/obj.target/canvas/src/closure.o.d.raw   -c
Release/obj.target/canvas/src/closure.o: ../src/closure.cc \
  ../src/closure.h ../src/Canvas.h ../src/backend/Backend.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-version.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-features.h \
  /opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-deprecated.h \
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
  /opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jpeglib.h \
  /opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jconfig.h \
  /opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jmorecfg.h \
  /opt/homebrew/Cellar/libpng/1.6.38/include/libpng16/png.h \
  /opt/homebrew/Cellar/libpng/1.6.38/include/libpng16/pnglibconf.h \
  /opt/homebrew/Cellar/libpng/1.6.38/include/libpng16/pngconf.h
../src/closure.cc:
../src/closure.h:
../src/Canvas.h:
../src/backend/Backend.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-version.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-features.h:
/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo/cairo-deprecated.h:
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
/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jpeglib.h:
/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jconfig.h:
/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include/jmorecfg.h:
/opt/homebrew/Cellar/libpng/1.6.38/include/libpng16/png.h:
/opt/homebrew/Cellar/libpng/1.6.38/include/libpng16/pnglibconf.h:
/opt/homebrew/Cellar/libpng/1.6.38/include/libpng16/pngconf.h:
