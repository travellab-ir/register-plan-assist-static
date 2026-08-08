import React, { Fragment, FC } from 'react';
import { Theme, Toolbar, Typography, IconButton, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { ChevronRight as NavigateNextIcon, ArrowLeft as BackIcon } from 'lucide-react';
import LinkTypography from './LinkTypography';
import LinkIconButton from './LinkIconButton';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    borderBottom: '1px solid',
    borderBottomColor: theme.palette.grey[500],
    backgroundColor: theme.palette.grey[300],
    margin: 0,
    padding: theme.spacing(0.5),
    paddingRight: theme.spacing(3),
    paddingLeft: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      paddingRight: theme.spacing(1),
      paddingLeft: theme.spacing(1)
    }
  },
  // No longer absolutely positioned: it now takes its natural place in the
  // flex row so the layout can't overlap or collide on narrow screens.
  // On phones the breadcrumb becomes horizontally scrollable instead of
  // wrapping or overflowing the viewport.
  navigation: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    flexShrink: 1,
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none'
    }
  },
  navigationItem: {
    flexShrink: 0
  },
  navigationNextIcon: {
    position: 'relative',
    top: '6px',
    margin: theme.spacing(0, 0.5),
    flexShrink: 0
  },
  tools: {
    float: 'right'
  },
  grow: {
    flexGrow: 1,
    minWidth: theme.spacing(2)
  }
}));

export interface NavBarLink {
  readonly title: string;
  readonly link?: string;
}

export interface NavBarProps {
  backLink?: string;
  backTitle?: string;
  navBarLinks: readonly (NavBarLink | false | null | undefined)[];
}

const NavBar: FC<NavBarProps> = ({ children, backLink, navBarLinks, backTitle }) => {
  const history = useHistory();
  const classes = useStyles();

  return (
    <Box display="block" displayPrint="none">
      <Toolbar className={classes.root} variant="dense">
        {backLink && (
          <LinkIconButton to={backLink} color="inherit" title={backTitle}>
            <BackIcon />
          </LinkIconButton>
          // <IconButton color="inherit" title={backTitle} onClick={() => history.goBack() /* history.push(backLink) */}>
          //   <BackIcon />
          // </IconButton>
        )}
        <div className={classes.navigation}>
          {(navBarLinks.filter(Boolean) as NavBarLink[]).map((navBarLink, index) => (
            <Fragment key={index}>
              {index > 0 && <NavigateNextIcon className={classes.navigationNextIcon} />}
              {navBarLink.link ? (
                <LinkTypography classes={{ root: classes.navigationItem }} variant="h6" display="inline" to={navBarLink.link as string}>
                  {navBarLink.title}
                </LinkTypography>
              ) : (
                <Typography classes={{ root: classes.navigationItem }} variant="h6" display="inline">
                  {navBarLink.title}
                </Typography>
              )}
            </Fragment>
          ))}
        </div>
        <div className={classes.grow} />
        {children}
      </Toolbar>
    </Box>
  );
};

export default NavBar;
