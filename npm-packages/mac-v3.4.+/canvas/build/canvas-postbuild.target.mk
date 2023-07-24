# This file is generated by gyp; do not edit.

TOOLSET := target
TARGET := canvas-postbuild
### Rules for final target.
LDFLAGS_Debug := \
	-undefined dynamic_lookup \
	-Wl,-search_paths_first \
	-mmacosx-version-min=10.13 \
	-arch arm64 \
	-L$(builddir) \
	-stdlib=libc++

LIBTOOLFLAGS_Debug := \
	-undefined dynamic_lookup \
	-Wl,-search_paths_first

LDFLAGS_Release := \
	-undefined dynamic_lookup \
	-Wl,-search_paths_first \
	-mmacosx-version-min=10.13 \
	-arch arm64 \
	-L$(builddir) \
	-stdlib=libc++

LIBTOOLFLAGS_Release := \
	-undefined dynamic_lookup \
	-Wl,-search_paths_first

LIBS :=

$(builddir)/canvas-postbuild.node: GYP_LDFLAGS := $(LDFLAGS_$(BUILDTYPE))
$(builddir)/canvas-postbuild.node: LIBS := $(LIBS)
$(builddir)/canvas-postbuild.node: GYP_LIBTOOLFLAGS := $(LIBTOOLFLAGS_$(BUILDTYPE))
$(builddir)/canvas-postbuild.node: TOOLSET := $(TOOLSET)
$(builddir)/canvas-postbuild.node:  FORCE_DO_CMD
	$(call do_cmd,solink_module)

all_deps += $(builddir)/canvas-postbuild.node
# Add target alias
.PHONY: canvas-postbuild
canvas-postbuild: $(builddir)/canvas-postbuild.node

# Short alias for building this executable.
.PHONY: canvas-postbuild.node
canvas-postbuild.node: $(builddir)/canvas-postbuild.node

# Add executable to "all" target.
.PHONY: all
all: $(builddir)/canvas-postbuild.node

