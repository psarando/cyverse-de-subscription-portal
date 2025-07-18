/**
 * A regular MUI Checkbox but using the theme's primary color
 *
 * @author aramsey, psarando
 */
import { Checkbox, CheckboxProps } from "@mui/material";

function DECheckbox(props: CheckboxProps) {
    return <Checkbox color="primary" {...props} />;
}

export default DECheckbox;
