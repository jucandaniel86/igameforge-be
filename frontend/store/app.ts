import { defineStore } from "pinia";

// Utilities
import {
  LAYOUTS,
  LAYOUT_THEME,
  LAYOUT_WIDTH,
  SITE_THEME,
  LAYOUT_POSITION,
  TOP_BAR,
  SIDEBAR_SIZE,
  SIDEBAR_COLOR,
  DIR,
} from "@/app/config";
import { setAttributes } from "~/app/menu";

const { VERTICAL } = LAYOUTS;

export const useLayoutStore = defineStore("layout-store", {
  state: (): { [key: string]: string } => ({
    layoutType: VERTICAL,
    layoutTheme: LAYOUT_THEME.DEFAULT,
    layoutWidth: LAYOUT_WIDTH.FLUID,
    mode: SITE_THEME.LIGHT,
    position: LAYOUT_POSITION.FIXED,
    topBarColor: TOP_BAR.LIGHT,
    sideBarSize: SIDEBAR_SIZE.DEFAULT,
    sideBarColor: SIDEBAR_COLOR.DARK,
    sideBarImage: "default",
    dir: DIR.LTR,
  }),
  actions: {
    changeLayoutType(layoutType: string) {
      this.layoutType = layoutType;
      setAttributes("data-layout", this.layoutType);
      this.changeSideBarSize(SIDEBAR_SIZE.DEFAULT);
    },
    changeSideBarSize(sideBarSize: string) {
      this.sideBarSize = sideBarSize;
      const { DEFAULT, COMPACT, SMALL } = SIDEBAR_SIZE;

      if (sideBarSize === DEFAULT) {
        setAttributes("data-sidebar-size", "lg");
      } else if (sideBarSize === COMPACT) {
        setAttributes("data-sidebar-size", "md");
      } else if (sideBarSize === SMALL) {
        setAttributes("data-sidebar-size", "sm");
      }
    },
    changeLayoutTheme(layoutTheme: string) {
      this.layoutTheme = layoutTheme;

      if (this.layoutTheme === LAYOUT_THEME.MINIMAL) {
        this.sideBarColor = SIDEBAR_COLOR.LIGHT;
      } else {
        this.sideBarColor = SIDEBAR_COLOR.DARK;
      }
      setAttributes("data-sidebar", this.sideBarColor);
      setAttributes("data-theme", this.layoutTheme);
    },
    changeMode(mode: string) {
      this.mode = mode;
      setAttributes("data-topbar", this.mode);
      setAttributes("data-bs-theme", this.mode);
    },
    changeLayoutWidth(layoutWidth: string) {
      this.layoutWidth = layoutWidth;
      setAttributes("data-layout-width", this.layoutWidth);
    },
    changeLayoutPosition(position: string) {
      this.position = position;
      setAttributes("data-layout-position", this.position);
    },
    changeTopBarColor(topBarColor: string) {
      this.topBarColor = topBarColor;
      setAttributes("data-topbar", this.topBarColor);
    },
    changeSideBarColor(sideBarColor: string) {
      this.sideBarColor = sideBarColor;
      setAttributes("data-sidebar", this.sideBarColor);
    },
    changeSideBarImage(sideBarImage: string) {
      this.sideBarImage = sideBarImage;
      setAttributes("data-sidebar-image", this.sideBarImage);
    },
  },
});
