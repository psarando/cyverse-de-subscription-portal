/**
 * A MUI Link for linking to external pages, opening in new tab.
 *
 * @author psarando
 */
import { Link, LinkProps } from "@mui/material";

const ExternalLink = (props: LinkProps) => {
    return (
        <Link
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            {...props}
        />
    );
};

export default ExternalLink;
