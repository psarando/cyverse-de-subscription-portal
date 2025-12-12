/**
 * Based on https://mui.com/material-ui/react-number-field/
 *
 * @author psarando
 */
import React from "react";

import { NumberField as BaseNumberField } from "@base-ui-components/react/number-field";
import {
    IconButton,
    FormControl,
    FormHelperText,
    OutlinedInput,
    InputAdornment,
    InputLabel,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

/**
 * This component is a placeholder for FormControl to correctly set the shrink label state on SSR.
 */
function SSRInitialFilled(_: BaseNumberField.Root.Props) {
    return null;
}
SSRInitialFilled.muiName = "Input";

const FormIntegerField = ({
    id: idProp,
    label,
    error,
    size = "medium",
    helperText,
    ...other
}: BaseNumberField.Root.Props & {
    label?: React.ReactNode;
    size?: "small" | "medium";
    error?: boolean;
    helperText?: string;
}) => {
    let id = React.useId();
    if (idProp) {
        id = idProp;
    }
    return (
        <BaseNumberField.Root
            {...other}
            render={(props, state) => (
                <FormControl
                    size={size}
                    ref={props.ref}
                    disabled={state.disabled}
                    required={state.required}
                    error={error}
                    variant="outlined"
                >
                    {props.children}
                </FormControl>
            )}
        >
            <SSRInitialFilled {...other} />
            <InputLabel htmlFor={id}>{label}</InputLabel>
            <BaseNumberField.Input
                id={id}
                render={(props, state) => (
                    <OutlinedInput
                        label={label}
                        inputRef={props.ref}
                        value={state.inputValue}
                        onBlur={props.onBlur}
                        onChange={props.onChange}
                        onKeyUp={props.onKeyUp}
                        onKeyDown={props.onKeyDown}
                        onFocus={props.onFocus}
                        slotProps={{
                            input: props,
                        }}
                        endAdornment={
                            <InputAdornment
                                position="end"
                                sx={{
                                    flexDirection: "column",
                                    maxHeight: "unset",
                                    alignSelf: "stretch",
                                    borderLeft: "1px solid",
                                    borderColor: "divider",
                                    ml: 0,
                                    "& button": {
                                        py: 0,
                                        flex: 1,
                                        borderRadius: 0.5,
                                    },
                                }}
                            >
                                <BaseNumberField.Increment
                                    render={
                                        <IconButton
                                            size={size}
                                            aria-label="Increase"
                                        />
                                    }
                                >
                                    <KeyboardArrowUpIcon
                                        fontSize={size}
                                        sx={{ transform: "translateY(2px)" }}
                                    />
                                </BaseNumberField.Increment>

                                <BaseNumberField.Decrement
                                    render={
                                        <IconButton
                                            size={size}
                                            aria-label="Decrease"
                                        />
                                    }
                                >
                                    <KeyboardArrowDownIcon
                                        fontSize={size}
                                        sx={{ transform: "translateY(-2px)" }}
                                    />
                                </BaseNumberField.Decrement>
                            </InputAdornment>
                        }
                        sx={{ pr: 0 }}
                    />
                )}
            />
            <FormHelperText sx={{ ml: 0, "&:empty": { mt: 0 } }}>
                {helperText}
            </FormHelperText>
        </BaseNumberField.Root>
    );
};

export default FormIntegerField;
