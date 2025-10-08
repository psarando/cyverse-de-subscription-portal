/**
 * @author psarando
 */
import React from "react";

import FormIntegerField from "./FormIntegerField";
import { mapAddonsPropsToValues } from "./formatters";

import { ADDONS_QUERY_KEY, getAddons } from "@/app/api/serviceFacade";
import {
    AddonsList,
    AddonsType,
    SubscriptionSummaryDetails,
} from "@/app/api/types";
import DEDialog from "@/components/common/DEDialog";
import { announce } from "@/components/common/announcer/CyVerseAnnouncer";
import { SUCCESS } from "@/components/common/announcer/AnnouncerConstants";
import { useCartInfo } from "@/contexts/cart";
import { formatCurrency } from "@/utils/formatUtils";
import { addonProratedRate } from "@/utils/rates";

import { Field, FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";

import { Button, Skeleton, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

function EditAddons({
    open,
    onClose,
    subscription,
}: {
    open: boolean;
    onClose: React.MouseEventHandler;
    subscription: SubscriptionSummaryDetails | undefined;
}) {
    const [cartInfo, setCartInfo] = useCartInfo();

    const { data: addonsQueryData, isFetching: loadingAddons } =
        useQuery<AddonsList>({
            queryKey: [ADDONS_QUERY_KEY],
            queryFn: getAddons,
            staleTime: Infinity,
        });

    const validationSchema = Yup.object().shape({
        addons: Yup.array().of(
            Yup.object().shape({
                amount: Yup.number()
                    .integer("Please enter a valid number.")
                    .min(0, "Must be 0 or greater."),
            }),
        ),
    });

    const subscriptionEndDate = subscription?.effective_end_date;
    const addons = addonsQueryData?.addons;

    return (
        <Formik
            enableReinitialize={true}
            initialValues={mapAddonsPropsToValues(addons, cartInfo)}
            validationSchema={validationSchema}
            onSubmit={(values) => {
                const addons = values.addons?.filter(
                    (addon) => addon.quantity > 0,
                );

                if (addons) {
                    setCartInfo({ ...cartInfo, addons });
                    onClose({} as React.MouseEvent);
                    announce({
                        text: addons.length
                            ? `Added ${addons.length} Add-on(s) to cart.`
                            : "Removed Add-ons from cart.",
                        variant: SUCCESS,
                    });
                }
            }}
        >
            {({ handleSubmit, values }) => {
                let subTotal = 0;
                if (values.addons) {
                    values.addons.forEach((addon) => {
                        if (addon.quantity > 0) {
                            subTotal +=
                                addonProratedRate(subscriptionEndDate, addon) *
                                addon.quantity;
                        }
                    });
                }

                return (
                    <Form>
                        <DEDialog
                            open={open}
                            onClose={onClose}
                            title="Purchase Add-ons"
                            actions={
                                <>
                                    <Button
                                        onClick={onClose}
                                        variant="outlined"
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        onClick={() => handleSubmit()}
                                        disabled={
                                            loadingAddons ||
                                            !(addons && addons.length > 0)
                                        }
                                    >
                                        Add to Cart
                                    </Button>
                                </>
                            }
                        >
                            {loadingAddons ? (
                                <Skeleton variant="text" />
                            ) : !(addons && addons.length > 0) ? (
                                <Typography color="error">
                                    Add-ons could not be loaded. Please try
                                    again later.
                                </Typography>
                            ) : (
                                <>
                                    <FieldArray name="addons">
                                        {() => (
                                            <>
                                                {values.addons?.map(
                                                    (addon, index) => (
                                                        <AddonFormField
                                                            key={addon.uuid}
                                                            addon={addon}
                                                            name={`addons.${index}.quantity`}
                                                        />
                                                    ),
                                                )}
                                            </>
                                        )}
                                    </FieldArray>
                                    <Typography variant="caption">
                                        * Charge amount will be proportional to
                                        the current subscription expiration
                                        date.
                                    </Typography>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{ marginTop: 2 }}
                                    >
                                        Subtotal: {formatCurrency(subTotal)} USD
                                    </Typography>
                                </>
                            )}
                        </DEDialog>
                    </Form>
                );
            }}
        </Formik>
    );
}

function AddonFormField({ addon, name }: { addon: AddonsType; name: string }) {
    const addonRate = formatCurrency(addon.addon_rates[0].rate);
    const resourceInBytes = addon.resource_type.unit === "bytes";

    let helperText = `${addonRate} USD* per ${addon.name}`;
    helperText += resourceInBytes
        ? " of data storage for 1 year."
        : ", to be used before the current subscription ends.";

    return (
        <Field
            name={name}
            component={FormIntegerField}
            label={`${addon.name} Add-on (${addonRate} USD*)`}
            helperText={helperText}
        />
    );
}

export default EditAddons;
