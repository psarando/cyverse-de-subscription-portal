/**
 * Display Skeleton loading mask for grid
 *
 * @author sriram, aramsey, psarando
 */
import { Fragment } from "react";

import GridLabelValue from "./GridLabelValue";

import { Grid } from "@mui/material";
import { Skeleton } from "@mui/material";

export default function GridLoading({ rows = 3 }: { rows?: number }) {
    const arrayRows = [...Array(rows)];
    return (
        <Grid container spacing={2}>
            {arrayRows.map((_, index) => (
                <Fragment key={index}>
                    <GridLabelValue label={<Skeleton variant="text" />}>
                        <Skeleton variant="text" />
                    </GridLabelValue>
                </Fragment>
            ))}
        </Grid>
    );
}
