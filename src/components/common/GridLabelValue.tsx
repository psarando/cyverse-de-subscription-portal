/**
 * A util to display label value within a grid container
 *
 * @author sriram, aramsey, psarando
 */
import { Grid, Typography, TypographyProps } from "@mui/material";
import { Property } from "csstype";

// A grid where the secondary column, values, intentionally take up more
// space than the first column, labels
export default function GridLabelValue({
    label,
    children,
    wordBreak = "break-word",
    ...props
}: TypographyProps & {
    label: React.ReactNode;
    children: React.ReactNode;
    wordBreak?: Property.WordBreak;
}) {
    return (
        <>
            <Grid size={{ sm: 3, xs: 6, md: 3, lg: 3 }}>
                <Typography component="span" variant="subtitle2" {...props}>
                    {label}
                </Typography>
            </Grid>
            <Grid
                size={{ sm: 9, xs: 6, md: 9, lg: 9 }}
                sx={{
                    maxWidth: "100%",
                    wordBreak,
                }}
            >
                {children}
            </Grid>
        </>
    );
}
