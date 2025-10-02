/**
 * @author psarando
 */
import React from "react";

import constants from "@/constants";

import { useCartInfo } from "@/contexts/cart";

import { getPlanTypes, PLAN_TYPES_QUERY_KEY } from "@/app/api/serviceFacade";
import { PlanType, SubscriptionSummaryDetails } from "@/app/api/types";

import DEDialog from "@/components/common/DEDialog";
import GridLabelValue from "@/components/common/GridLabelValue";
import QuotaDetails from "@/components/common/QuotaDetails";
import UsageDetails from "@/components/common/UsageDetails";
import { announce } from "@/components/common/announcer/CyVerseAnnouncer";
import { SUCCESS } from "@/components/common/announcer/AnnouncerConstants";
import FormTextField from "@/components/forms/FormTextField";

import { formatQuota } from "@/utils/formatUtils";

import { mapSubscriptionPropsToValues, formatSubscription } from "./formatters";

import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useQuery } from "@tanstack/react-query";

import {
    Button,
    Grid,
    ListItemText,
    MenuItem,
    Skeleton,
    Typography,
} from "@mui/material";

type EditSubscriptionProps = {
    subscription: SubscriptionSummaryDetails | undefined;
    open: boolean;
    onClose: React.MouseEventHandler;
};

function EditSubscription({
    subscription,
    open,
    onClose,
}: EditSubscriptionProps) {
    const [cartInfo, setCartInfo] = useCartInfo();

    const { data: planTypesQueryData, isFetching: loadingPlanTypes } =
        useQuery<{ result: PlanType[] }>({
            queryKey: [PLAN_TYPES_QUERY_KEY],
            queryFn: getPlanTypes,
            staleTime: Infinity,
        });

    let planTypes: PlanType[] = [];
    if (planTypesQueryData?.result) {
        planTypes = [...planTypesQueryData.result];
    }

    const dialogTitle =
        subscription && subscription.plan.name !== constants.PLAN_NAME_BASIC
            ? "Renew Subscription"
            : "Upgrade Subscription";

    const hasAddons = subscription && subscription.addons.length > 0;
    const currentQuotasLabel = hasAddons ? "Current Quotas*" : "Current Quotas";

    const validationSchema = Yup.object().shape({
        plan_name: Yup.string()
            .required("Required")
            .not(
                [constants.PLAN_NAME_BASIC],
                "Please select another subscription plan.",
            ),
        periods: Yup.number()
            .required("Required")
            .integer("Please enter a valid number.")
            .positive("Must be greater than 0."),
    });

    return (
        <Formik
            initialValues={mapSubscriptionPropsToValues(subscription, cartInfo)}
            validationSchema={validationSchema}
            onSubmit={(values) => {
                setCartInfo({
                    ...cartInfo,
                    subscription: formatSubscription(
                        values,
                        subscription as SubscriptionSummaryDetails,
                    ),
                });

                // Pass a dummy event to onClose.
                onClose({} as React.MouseEvent);
                announce({
                    text: `Added ${values.plan_name} subscription to cart.`,
                    variant: SUCCESS,
                });
            }}
            enableReinitialize={true}
        >
            {({ handleSubmit, values }) => {
                const selectedPlanType = planTypes.find(
                    (type) => type.name === values.plan_name,
                );

                return (
                    <Form>
                        <DEDialog
                            open={open}
                            onClose={onClose}
                            title={dialogTitle}
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
                                    >
                                        {cartInfo.subscription
                                            ? "Update"
                                            : "Add to"}{" "}
                                        Cart
                                    </Button>
                                </>
                            }
                        >
                            {loadingPlanTypes ? (
                                <Skeleton variant="text" />
                            ) : (
                                <Field
                                    name="plan_name"
                                    component={FormTextField}
                                    label="Plan"
                                    required
                                    select
                                    variant="outlined"
                                    size="small"
                                >
                                    {planTypes.map(
                                        (type: PlanType, index: number) => (
                                            <MenuItem
                                                key={index}
                                                value={type.name}
                                            >
                                                <ListItemText
                                                    primary={type.name}
                                                    secondary={`$${type.plan_rates[0].rate}`}
                                                />
                                            </MenuItem>
                                        ),
                                    )}
                                </Field>
                            )}
                            <Field
                                name="periods"
                                component={FormTextField}
                                label="Subscription Length"
                                required
                                select
                                variant="outlined"
                                size="small"
                            >
                                <MenuItem value={1}>
                                    <ListItemText primary="1 Year" />
                                </MenuItem>
                                <MenuItem value={2}>
                                    <ListItemText primary="2 Years" />
                                </MenuItem>
                            </Field>
                            <Grid container>
                                <GridLabelValue label="Plan Quotas">
                                    <PlanQuotaDetails
                                        planType={selectedPlanType}
                                    />
                                </GridLabelValue>
                                <GridLabelValue label={currentQuotasLabel}>
                                    <QuotaDetails subscription={subscription} />
                                    {hasAddons && (
                                        <Typography variant="caption">
                                            * includes Add-ons
                                        </Typography>
                                    )}
                                </GridLabelValue>
                                <GridLabelValue label="Usages">
                                    <UsageDetails subscription={subscription} />
                                </GridLabelValue>
                            </Grid>
                        </DEDialog>
                    </Form>
                );
            }}
        </Formik>
    );
}

const PlanQuotaDetails = ({ planType }: { planType?: PlanType }) => {
    return (
        <>
            {planType &&
                planType?.plan_quota_defaults.length > 0 &&
                planType.plan_quota_defaults.map((item) => (
                    <Typography key={item.id}>
                        {formatQuota(item.quota_value, item.resource_type.unit)}
                    </Typography>
                ))}
        </>
    );
};

export default EditSubscription;
