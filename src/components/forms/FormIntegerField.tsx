/**
 * @author psarando
 */
import React from "react";

import FormTextField from "./FormTextField";

import { FieldInputProps, FieldProps } from "formik";
import { TextFieldProps } from "@mui/material";

const onIntegerChange =
    (onChange: FieldInputProps<TextFieldProps>["onChange"]) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        const intVal = Number(newValue);
        if (Number.isInteger(intVal)) {
            onChange(event);
        }
    };

const FormIntegerField = ({
    field: { onChange, ...field },
    ...props
}: FieldProps) => (
    <FormTextField
        slotProps={{ input: { inputMode: "numeric" } }}
        field={{ ...field, onChange: onIntegerChange(onChange) }}
        {...props}
    />
);

export default FormIntegerField;
