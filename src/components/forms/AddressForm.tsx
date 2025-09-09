/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { Field } from "formik";

import { Grid } from "@mui/material";
import { styled } from "@mui/material/styles";

import FormTextField from "./FormTextField";

const FormGrid = styled(Grid)(() => ({
    display: "flex",
    flexDirection: "column",
}));

export default function AddressForm() {
    return (
        <Grid container spacing={3}>
            <FormGrid size={{ xs: 12, md: 6 }}>
                <Field
                    name="billTo.firstName"
                    component={FormTextField}
                    label="First name"
                    type="name"
                    autoComplete="first name"
                    required
                    size="small"
                />
            </FormGrid>
            <FormGrid size={{ xs: 12, md: 6 }}>
                <Field
                    name="billTo.lastName"
                    component={FormTextField}
                    label="Last name"
                    type="last-name"
                    autoComplete="last name"
                    required
                    size="small"
                />
            </FormGrid>
            <FormGrid size={{ xs: 12 }}>
                <Field
                    name="billTo.company"
                    component={FormTextField}
                    label="Company"
                    type="company"
                    autoComplete="company"
                    size="small"
                />
            </FormGrid>
            <FormGrid size={{ xs: 12 }}>
                <Field
                    name="billTo.address"
                    component={FormTextField}
                    label="Address"
                    type="address"
                    autoComplete="billing address"
                    required
                    size="small"
                />
            </FormGrid>
            <FormGrid size={{ xs: 6 }}>
                <Field
                    name="billTo.city"
                    component={FormTextField}
                    label="City"
                    type="city"
                    autoComplete="City"
                    required
                    size="small"
                />
            </FormGrid>
            <FormGrid size={{ xs: 6 }}>
                <Field
                    name="billTo.state"
                    component={FormTextField}
                    label="State"
                    type="state"
                    autoComplete="State"
                    required
                    size="small"
                />
            </FormGrid>
            <FormGrid size={{ xs: 6 }}>
                <Field
                    name="billTo.zip"
                    component={FormTextField}
                    label="Zip / Postal code"
                    type="zip"
                    autoComplete="billing postal-code"
                    required
                    size="small"
                />
            </FormGrid>
            <FormGrid size={{ xs: 6 }}>
                <Field
                    name="billTo.country"
                    component={FormTextField}
                    label="Country"
                    type="country"
                    placeholder="US"
                    autoComplete="billing country"
                    required
                    size="small"
                />
            </FormGrid>
        </Grid>
    );
}
