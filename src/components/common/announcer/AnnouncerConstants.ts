/**
 * Number of milliseconds after which the displayed messages vanishes.
 */
export const TIMEOUT = 6000;
export const EMPTY_QUEUE_TIMEOUT = 500;

export enum VerticalAlignmentEnum {
    /**
     * A vertical position variant enum that will display messages on top of the screen.
     */
    TOP = "top",

    /**
     * A vertical position variant enum that will display messages on bottom of the screen.
     */
    BOTTOM = "bottom",
}

export enum HorizontalAlignmentEnum {
    /**
     * A horizontal position variant enum that will display messages on right of the screen.
     */
    RIGHT = "right",

    /**
     * A horizontal position variant enum that will display messages on left of the screen.
     */
    LEFT = "left",

    /**
     * A horizontal position variant enum that will display messages on center of the screen.
     */
    CENTER = "center",
}

export enum VariantEnum {
    /**
     * A message variant enum that will display info messages.
     */
    INFO = "info",

    /**
     * A message variant enum that will display error messages.
     */
    ERROR = "error",

    /**
     * A message variant enum that will display warning messages.
     */
    WARNING = "warning",

    /**
     * A message variant enum that will display success messages.
     */
    SUCCESS = "success",
}

const { TOP, BOTTOM } = VerticalAlignmentEnum;
const { RIGHT, LEFT, CENTER } = HorizontalAlignmentEnum;
const { INFO, ERROR, WARNING, SUCCESS } = VariantEnum;

export { TOP, BOTTOM, RIGHT, LEFT, CENTER, INFO, ERROR, WARNING, SUCCESS };
