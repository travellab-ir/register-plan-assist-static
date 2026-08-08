import React, { FC, useRef, useState } from 'react';
import { Theme, AppBar as MaterialUiAppBar, Toolbar, IconButton, Typography, Menu, MenuItem, ButtonBase, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import {
  ChevronLeft as ArrowBackIcon,
  RefreshCw as SyncIcon,
  MonitorPlay as ViewModuleIcon,
  Maximize as FullScreenIcon,
  Minimize as ExitFullScreenIcon,
  MoreVertical as MoreVertIcon
} from 'lucide-react';
import classNames from 'classnames';
import persistant from 'src/utils/persistant';
import config from 'src/config';
import { useIsCompact } from 'src/utils/useResponsive';

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
    height: theme.spacing(6)
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
  userNameCompact: {
    maxWidth: 90,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    verticalAlign: 'middle'
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
      <MaterialUiAppBar position="relative" className={classes.appBarStyle}>
        <Toolbar variant="dense" className={classes.toolbarStyle}>
          <IconButton
            size={isCompact ? 'small' : 'medium'}
            onClick={() => (window.location.href = 'http://apps.mahan.aero/')}
            color="inherit"
            title="Back To Other Module"
          >
            <ArrowBackIcon className={classes.backIcon} />
          </IconButton>
          <IconButton size={isCompact ? 'small' : 'medium'} color="inherit" onClick={() => window.location.reload()} title={loading ? 'Loading...' : 'Refresh Page'}>
            <SyncIcon className={classNames({ 'animate-spin-reverse': loading })} />
          </IconButton>

          <Typography classes={{ root: classNames(classes.textMargin, classes.notSelectable) }} variant="h5" color="inherit" title={config.version}>
            RPA
          </Typography>

          {!!persistant.user && (
            <ButtonBase>
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
          >
            <MenuItem
              onClick={() => {
                setUserDisplayNameMenuModel({ open: false });
                delete persistant.oauthCode;
                delete persistant.refreshToken;
                delete persistant.user;
                delete persistant.userSettings;
                delete persistant.encodedAuthenticationHeader;
                window.location.reload(); //TODO: Call logout API instead.
              }}
            >
              Logout
            </MenuItem>
          </Menu>

          <div className={classes.grow} />

          {isCompact ? (
            <>
              <IconButton size="small" color="inherit" title="More" onClick={event => setOverflowMenuAnchor(event.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
              <Menu anchorEl={overflowMenuAnchor} open={!!overflowMenuAnchor} onClose={() => setOverflowMenuAnchor(null)}>
                <MenuItem onClick={() => setOverflowMenuAnchor(null)}>Select Module</MenuItem>
                <MenuItem
                  onClick={() => {
                    setOverflowMenuAnchor(null);
                    toggleFullScreen();
                  }}
                >
                  {fullScreen ? 'Exit Full Screen' : 'Full Screen'}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <IconButton color="inherit" title="Select Module">
                <ViewModuleIcon />
              </IconButton>
              <IconButton color="inherit" title={fullScreen ? 'Exit Full Screen' : 'Full Screen'} onClick={() => toggleFullScreen()}>
                {fullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}
              </IconButton>
            </>
          )}

          <i className={classNames('rpa-icon-mahan-air-logo', classes.iconSize)} title="Mahan Air" />
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
