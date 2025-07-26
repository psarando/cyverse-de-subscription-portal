/**
 * @author psarando
 */
import getFormError from "./getFormError";

import { FieldProps } from "formik";
import TextField from "@mui/material/TextField";

const FormTextField = ({
    field,
    label,
    helperText,
    required,
    form: { touched, errors },
    ...custom
}: FieldProps & { label: string; helperText: string; required: boolean }) => {
    const errorMsg = getFormError(field.name, touched, errors);
    return (
        <TextField
            label={label}
            error={!!errorMsg}
            helperText={errorMsg || helperText}
            required={required}
            variant="outlined"
            margin="dense"
            size="small"
            fullWidth
            {...field}
            {...custom}
        />
    );
};

export default FormTextField;
