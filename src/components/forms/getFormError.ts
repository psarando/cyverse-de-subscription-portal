/**
 * @author psarando
 */
import { getIn } from "formik";

import type { FieldProps } from "formik";

const getFormError = (
    name: string,
    touched: FieldProps["form"]["touched"],
    errors: FieldProps["form"]["errors"],
) => {
    const error = getIn(errors, name);
    const touch = getIn(touched, name);

    return touch && error ? error : null;
};

export default getFormError;
