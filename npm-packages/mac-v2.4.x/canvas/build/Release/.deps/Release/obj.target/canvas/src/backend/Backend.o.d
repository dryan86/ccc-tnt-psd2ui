cmd_Release/obj.target/canvas/src/backend/Backend.o := c++ -o Release/obj.target/canvas/src/backend/Backend.o ../src/backend/Backend.cc '-DNODE_GYP_MODULE_NAME=canvas' '-DUSING_UV_SHARED=1' '-DUSING_V8_SHARED=1' '-DV8_DEPRECATION_WARNINGS=1' '-DV8_DEPRECATION_WARNINGS' '-DV8_IMMINENT_DEPRECATION_WARNINGS' '-D_GLIBCXX_USE_CXX11_ABI=1' '-D_DARWIN_USE_64_BIT_INODE=1' '-D_LARGEFILE_SOURCE' '-D_FILE_OFFSET_BITS=64' '-DOPENSSL_NO_PINSHARED' '-DOPENSSL_THREADS' '-DHAVE_JPEG' '-DHAVE_GIF' '-DHAVE_RSVG' '-DBUILDING_NODE_EXTENSION' -I/Users/wsl/Library/Caches/node-gyp/16.14.0/include/node -I/Users/wsl/Library/Caches/node-gyp/16.14.0/src -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/openssl/config -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/openssl/openssl/include -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/uv/include -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/zlib -I/Users/wsl/Library/Caches/node-gyp/16.14.0/deps/v8/include -I../../nan -I/opt/homebrew/Cellar/cairo/1.16.0_5/include/cairo -I/opt/homebrew/Cellar/glib/2.74.0/include -I/opt/homebrew/Cellar/glib/2.74.0/include/glib-2.0 -I/opt/homebrew/Cellar/glib/2.74.0/lib/glib-2.0/include -I/opt/homebrew/opt/gettext/include -I/opt/homebrew/Cellar/pcre2/10.40/include -I/opt/homebrew/Cellar/pixman/0.40.0/include/pixman-1 -I/opt/homebrew/Cellar/fontconfig/2.14.1/include -I/opt/homebrew/opt/freetype/include/freetype2 -I/opt/homebrew/Cellar/libpng/1.6.38/include/libpng16 -I/opt/homebrew/Cellar/libxcb/1.15/include -I/opt/homebrew/Cellar/libxrender/0.9.10/include -I/opt/homebrew/Cellar/libxext/1.3.5/include -I/opt/homebrew/Cellar/libx11/1.8.2/include -I/opt/homebrew/Cellar/libxau/1.0.10/include -I/opt/homebrew/Cellar/libxdmcp/1.1.3/include -I/opt/homebrew/Cellar/xorgproto/2022.2/include -I/Library/Developer/CommandLineTools/SDKs/MacOSX12.sdk/usr/include/ffi -I/opt/homebrew/Cellar/pango/1.50.11/include/pango-1.0 -I/opt/homebrew/Cellar/harfbuzz/5.3.1/include/harfbuzz -I/opt/homebrew/Cellar/fribidi/1.0.12/include/fribidi -I/opt/homebrew/Cellar/graphite2/1.3.14/include -I/opt/homebrew/Cellar/jpeg-turbo/2.1.4/include -I/opt/homebrew/include -I/opt/homebrew/Cellar/librsvg/2.55.1/include/librsvg-2.0 -I/opt/homebrew/Cellar/gdk-pixbuf/2.42.10/include/gdk-pixbuf-2.0 -I/opt/homebrew/Cellar/libtiff/4.4.0_1/include  -O3 -gdwarf-2 -mmacosx-version-min=10.13 -arch arm64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++14 -stdlib=libc++ -fno-rtti -fno-strict-aliasing -MMD -MF ./Release/.deps/Release/obj.target/canvas/src/backend/Backend.o.d.raw   -c
Release/obj.target/canvas/src/backend/Backend.o: \
  ../src/backend/Backend.cc ../src/backend/Backend.h \
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
  ../../nan/nan_scriptorigin.h
../src/backend/Backend.cc:
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
