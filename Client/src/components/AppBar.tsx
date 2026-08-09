import React, { FC, useRef, useState } from 'react';
import { Theme, AppBar as MaterialUiAppBar, Toolbar, IconButton, Typography, Menu, MenuItem, ListItemIcon, ButtonBase, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import {
  ChevronLeft as ArrowBackIcon,
  RefreshCw as SyncIcon,
  LayoutGrid as ViewModuleIcon,
  Maximize as FullScreenIcon,
  Minimize as ExitFullScreenIcon,
  MoreVertical as MoreVertIcon,
  LogOut as LogoutIcon
} from 'lucide-react';
import classNames from 'classnames';
import persistant from 'src/utils/persistant';
import RequestManager from 'src/utils/RequestManager';
import config from 'src/config';
import { useIsCompact } from 'src/utils/useResponsive';

// Header palette lives here rather than in the shared theme: it's a
// one-off, deliberately bolder treatment for the app's masthead, not a
// color other components should inherit.
const headerAccent = '#22D3EE'; // bright cyan — status, focus rings, the signature underline
const headerAccentDim = 'rgba(34, 211, 238, 0.45)';

const useStyles = makeStyles((theme: Theme) => ({
  textMargin: {
    marginLeft: theme.spacing(1.5),
    marginRight: theme.spacing(1.5),
    [theme.breakpoints.down('xs')]: {
      marginLeft: theme.spacing(0.75),
      marginRight: theme.spacing(0.75)
    }
  },
  notSelectable: {
    userSelect: 'none'
  },
  grow: {
    flexGrow: 1
  },
  iconSize: {
    fontSize: 40,
    [theme.breakpoints.down('xs')]: {
      fontSize: 28
    }
  },
  backIcon: {
    position: 'relative',
    left: 5
  },
  appBarStyle: {
    position: 'relative',
    height: theme.spacing(6),
    // A deep indigo-to-violet gradient reads as a control-room instrument
    // panel rather than a flat, generic toolbar — modern without being loud.
    backgroundImage: 'linear-gradient(115deg, #1E1B4B 0%, #4338CA 55%, #6D28D9 100%)',
    boxShadow: '0 2px 18px rgba(30, 27, 75, 0.35)',
    overflow: 'hidden'
  },
  // Thin glowing rule along the bottom edge — the header's one signature
  // flourish. It brightens while data is loading, giving the whole bar a
  // second, ambient "system is working" signal beyond the spin icon alone.
  statusRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundImage: `linear-gradient(90deg, transparent, ${headerAccent}, transparent)`,
    backgroundSize: '50% 100%',
    backgroundRepeat: 'no-repeat',
    opacity: 0.35,
    transition: 'opacity 200ms ease'
  },
  statusRuleActive: {
    opacity: 1,
    animation: '$sweep 1.4s ease-in-out infinite',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none'
    }
  },
  '@keyframes sweep': {
    '0%': { backgroundPosition: '-120% 0' },
    '100%': { backgroundPosition: '220% 0' }
  },
  toolbarStyle: {
    // Prevents the bar from ever forcing horizontal scroll on narrow phones.
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    [theme.breakpoints.down('xs')]: {
      paddingLeft: theme.spacing(0.5),
      paddingRight: theme.spacing(0.5)
    }
  },
  iconButton: {
    borderRadius: theme.spacing(1),
    transition: 'background-color 150ms ease, transform 150ms ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.14)'
    },
    // Explicit, high-contrast focus ring: against a gradient, the browser's
    // default outline can disappear — this keeps keyboard navigation visible
    // and unambiguous everywhere on the bar.
    '&:focus-visible': {
      outline: `2px solid ${headerAccent}`,
      outlineOffset: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.14)'
    }
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center'
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: headerAccent,
    marginInlineStart: theme.spacing(0.75),
    boxShadow: `0 0 8px ${headerAccentDim}`
  },
  brandText: {
    fontWeight: 700,
    letterSpacing: '0.06em'
  },
  userNameCompact: {
    maxWidth: 90,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    verticalAlign: 'middle'
  },
  userTrigger: {
    borderRadius: theme.spacing(1),
    padding: theme.spacing(0.25, 1),
    transition: 'background-color 150ms ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    '&:focus-visible': {
      outline: `2px solid ${headerAccent}`,
      outlineOffset: 2
    }
  },
  menuIcon: {
    color: theme.palette.text.secondary,
    minWidth: 32
  },
  // A floating, rounded card instead of MUI's stock square dropdown — the
  // soft shadow and hairline border read as a deliberate, modern surface
  // rather than a default browser-ish menu.
  menuPaper: {
    marginTop: theme.spacing(1),
    minWidth: 208,
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.grey[200]}`,
    boxShadow: '0 16px 40px rgba(30, 27, 75, 0.16), 0 2px 8px rgba(30, 27, 75, 0.08)',
    overflow: 'hidden',
    '& .MuiList-root': {
      padding: theme.spacing(0.75)
    },
    '& .MuiMenuItem-root': {
      borderRadius: theme.spacing(1),
      padding: theme.spacing(1, 1.25),
      fontSize: '0.875rem',
      transition: 'background-color 120ms ease',
      '&:hover': {
        backgroundColor: 'rgba(67, 56, 202, 0.08)'
      }
    }
  }
}));

interface UserDisplayNameMenuModel {
  open?: boolean;
}

export interface AppBarProps {
  loading: boolean;
}

const AppBar: FC<AppBarProps> = ({ loading }) => {
  const [userDisplayNameMenuModel, setUserDisplayNameMenuModel] = useState<UserDisplayNameMenuModel>({});
  const [fullScreen, setFullScreen] = useState(false);
  const [overflowMenuAnchor, setOverflowMenuAnchor] = useState<HTMLElement | null>(null);

  const userDisplayNameRef = useRef(null);

  const classes = useStyles();
  const isCompact = useIsCompact();

  return (
    <Box display="block" displayPrint="none">
      <MaterialUiAppBar position="relative" className={classes.appBarStyle} elevation={0}>
        <Toolbar variant="dense" className={classes.toolbarStyle}>
          <IconButton
            className={classes.iconButton}
            size={isCompact ? 'small' : 'medium'}
            onClick={() => (window.location.href = 'http://apps.mahan.aero/')}
            color="inherit"
            title="Back To Other Module"
            aria-label="Back to other module"
          >
            <ArrowBackIcon className={classes.backIcon} />
          </IconButton>
          <IconButton
            className={classes.iconButton}
            size={isCompact ? 'small' : 'medium'}
            color="inherit"
            onClick={() => window.location.reload()}
            title={loading ? 'Loading...' : 'Refresh Page'}
            aria-label={loading ? 'Loading' : 'Refresh page'}
          >
            <SyncIcon className={classNames({ 'animate-spin-reverse': loading })} />
          </IconButton>

          <Typography classes={{ root: classNames(classes.textMargin, classes.notSelectable, classes.brand) }} variant="h5" color="inherit" title={config.version}>
            <span className={classes.brandText}>RPA</span>
            <span className={classes.brandDot} aria-hidden="true" />
          </Typography>

          {!!persistant.user && (
            <ButtonBase
              className={classes.userTrigger}
              aria-haspopup="menu"
              aria-expanded={!!userDisplayNameMenuModel.open}
              aria-controls="user-display-name-menu"
            >
              <Typography
                classes={{ root: classNames(classes.textMargin, { [classes.userNameCompact]: isCompact }) }}
                variant="h6"
                color="inherit"
                ref={userDisplayNameRef}
                onClick={() => setUserDisplayNameMenuModel({ open: true })}
              >
                {persistant.user!.displayName}
              </Typography>
            </ButtonBase>
          )}
          <Menu
            id="user-display-name-menu"
            anchorEl={userDisplayNameRef.current}
            open={!!userDisplayNameMenuModel.open}
            onClose={() => setUserDisplayNameMenuModel({ open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ className: classes.menuPaper }}
          >
            <MenuItem
              onClick={async () => {
                setUserDisplayNameMenuModel({ open: false });
                try {
                  await RequestManager.request('oauth', 'logout');
                } catch (reason) {
                  // Even if the server call fails (e.g. token already expired, network error),
                  // still clear the local session and send the user back to the login page.
                  console.error('Logout API call failed', reason);
                }
                delete persistant.oauthCode;
                delete persistant.refreshToken;
                delete persistant.user;
                delete persistant.userSettings;
                delete persistant.encodedAuthenticationHeader;
                window.location.reload();
              }}
            >
              <ListItemIcon className={classes.menuIcon}>
                <LogoutIcon size={18} />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          <div className={classes.grow} />

          {isCompact ? (
            <>
              <IconButton
                className={classes.iconButton}
                size="small"
                color="inherit"
                title="More"
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={!!overflowMenuAnchor}
                aria-controls="app-overflow-menu"
                onClick={event => setOverflowMenuAnchor(event.currentTarget)}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                id="app-overflow-menu"
                anchorEl={overflowMenuAnchor}
                open={!!overflowMenuAnchor}
                onClose={() => setOverflowMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ className: classes.menuPaper }}
              >
                <MenuItem onClick={() => setOverflowMenuAnchor(null)}>
                  <ListItemIcon className={classes.menuIcon}>
                    <ViewModuleIcon size={18} />
                  </ListItemIcon>
                  Select Module
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOverflowMenuAnchor(null);
                    toggleFullScreen();
                  }}
                >
                  <ListItemIcon className={classes.menuIcon}>
                    {fullScreen ? <ExitFullScreenIcon size={18} /> : <FullScreenIcon size={18} />}
                  </ListItemIcon>
                  {fullScreen ? 'Exit Full Screen' : 'Full Screen'}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <IconButton className={classes.iconButton} color="inherit" title="Select Module" aria-label="Select module">
                <ViewModuleIcon />
              </IconButton>
              <IconButton
                className={classes.iconButton}
                color="inherit"
                title={fullScreen ? 'Exit Full Screen' : 'Full Screen'}
                aria-label={fullScreen ? 'Exit full screen' : 'Enter full screen'}
                onClick={() => toggleFullScreen()}
              >
                {fullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}
              </IconButton>
            </>
          )}

          <i className={classNames('rpa-icon-mahan-air-logo', classes.iconSize)} title="Mahan Air" />

          <span className={classNames(classes.statusRule, { [classes.statusRuleActive]: loading })} aria-hidden="true" />
        </Toolbar>
      </MaterialUiAppBar>
    </Box>
  );

  function toggleFullScreen() {
    let doc: any = document;
    let isInFullScreen =
      (doc.fullscreenElement && doc.fullscreenElement !== null) ||
      (doc.webkitFullscreenElement && doc.webkitFullscreenElement !== null) ||
      (doc.mozFullScreenElement && doc.mozFullScreenElement !== null) ||
      (doc.msFullscreenElement && doc.msFullscreenElement !== null);

    let docElm: any = document.documentElement;
    if (!isInFullScreen) {
      setFullScreen(true);
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
      } else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
      } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        setFullScreen(false);
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }
};

export default AppBar;
