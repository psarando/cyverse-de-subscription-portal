/**
 * A component that displays formatted error message with options to contact support.
 *
 * @author sriram, psarando
 */
import { HttpError } from "@/app/api/serviceFacade";
import SignInCard from "@/components/SignInCard";
import ContactSupport from "@/components/common/ContactSupport";
import GridLabelValue from "@/components/common/GridLabelValue";
import ClientInfo from "./ClientInfo";

import {
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    Typography,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";

const ErrorCardTemplate = ({
    avatar,
    title,
    subheader,
    children,
}: {
    avatar: React.ReactNode;
    title: React.ReactNode;
    subheader?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <Card>
        <CardHeader avatar={avatar} title={title} subheader={subheader} />
        <Divider />
        <CardContent>{children}</CardContent>
        <Divider />
        <CardActions>
            <ContactSupport />
        </CardActions>
    </Card>
);

const BasicErrorCard = () => (
    <ErrorCardTemplate
        avatar={<ErrorIcon fontSize="large" color="error" />}
        title={
            <Typography color="error" variant="h6">
                Oops!
            </Typography>
        }
        subheader={
            <Typography color="error">
                This wasn{"'"}t supposed to happen. Please try again or contact
                support!
            </Typography>
        }
    >
        <Grid container spacing={2}>
            <ClientInfo />
        </Grid>
    </ErrorCardTemplate>
);

const NotAuthorizedCard = () => (
    <ErrorCardTemplate
        avatar={<SupervisorAccountIcon color="primary" fontSize="large" />}
        title={
            <Typography component="span" variant="h6">
                Not Authorized
            </Typography>
        }
    >
        <Typography>You are not authorized to view this page.</Typography>
    </ErrorCardTemplate>
);

const ParsedErrorCard = ({ errorObject }: { errorObject: HttpError }) => {
    let errorData;

    try {
        errorData = JSON.parse(errorObject.response);
    } catch {
        console.error({ errorResponse: errorObject.response });
    }

    return (
        <ErrorCardTemplate
            avatar={<ErrorIcon fontSize="large" color="error" />}
            title={
                <Typography color="error" variant="h6">
                    Error
                </Typography>
            }
            subheader={
                <Typography color="error" variant="subtitle2">
                    {errorObject.message}
                </Typography>
            }
        >
            <Grid container spacing={2}>
                <GridLabelValue label="Requested URL">
                    <Typography>
                        {errorObject.method} {errorObject.url}
                    </Typography>
                </GridLabelValue>
                <GridLabelValue label="Status Code">
                    <Typography>{errorObject.status}</Typography>
                </GridLabelValue>
                <GridLabelValue label="Error Code">
                    <Typography>{errorData?.error_code}</Typography>
                </GridLabelValue>
                <GridLabelValue label="Reason">
                    <Typography>
                        {JSON.stringify(
                            errorData?.reason ||
                                errorData?.message ||
                                errorData?.grouper_result_message,
                        )}
                    </Typography>
                </GridLabelValue>
                <ClientInfo />
            </Grid>
        </ErrorCardTemplate>
    );
};

const ErrorHandler = ({ errorObject }: { errorObject: unknown }) => {
    if (!(errorObject instanceof HttpError)) {
        return <BasicErrorCard />;
    } else if (errorObject.status === 401) {
        return <SignInCard />;
    } else if (errorObject.status === 403) {
        return <NotAuthorizedCard />;
    }

    return <ParsedErrorCard errorObject={errorObject} />;
};

export default ErrorHandler;
