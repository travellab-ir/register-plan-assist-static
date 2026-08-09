import React, { Fragment, FC } from 'react';
import { Theme, Toolbar, Typography, IconButton, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { ChevronRight as NavigateNextIcon, ArrowLeft as BackIcon } from 'lucide-react';
import LinkTypography from './LinkTypography';
import LinkIconButton from './LinkIconButton';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) => ({
  // Flat grey banner replaced with a clean white surface: a hairline
  // border does the separating instead of a filled background, so this
  // bar reads as part of the page (like the AppBar above it) rather than
  // a second, competing toolbar stacked underneath it.
  root: {
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    backgroundColor: theme.palette.common.white,
    margin: 0,
    padding: theme.spacing(1.25, 3),
    display: 'flex',
    alignItems: 'center',
    minHeight: 56,
    [theme.breakpoints.down('xs')]: {
      paddingRight: theme.spacing(2),
      paddingLeft: theme.spacing(2)
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
    flexShrink: 0,
    fontWeight: 700,
    color: theme.palette.text.primary
  },
  navigationItemLink: {
    fontWeight: 600,
    color: theme.palette.text.secondary,
    transition: 'color 120ms ease',
    '&:hover': {
      color: theme.palette.primary.main
    }
  },
  navigationNextIcon: {
    position: 'relative',
    top: '6px',
    margin: theme.spacing(0, 0.5),
    flexShrink: 0,
    color: theme.palette.text.disabled
  },
  tools: {
    float: 'right'
  },
  grow: {
    flexGrow: 1,
    minWidth: theme.spacing(2)
  },
  backButton: {
    marginInlineEnd: theme.spacing(1),
    color: theme.palette.text.secondary,
    borderRadius: theme.spacing(1),
    transition: 'background-color 150ms ease, color 150ms ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
      color: theme.palette.primary.main
    }
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
          <LinkIconButton className={classes.backButton} to={backLink} title={backTitle}>
            <BackIcon size={20} />
          </LinkIconButton>
        )}
        <div className={classes.navigation}>
          {(navBarLinks.filter(Boolean) as NavBarLink[]).map((navBarLink, index) => (
            <Fragment key={index}>
              {index > 0 && <NavigateNextIcon size={16} className={classes.navigationNextIcon} />}
              {navBarLink.link ? (
                <LinkTypography classes={{ root: classes.navigationItemLink }} variant="h6" display="inline" to={navBarLink.link as string}>
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
