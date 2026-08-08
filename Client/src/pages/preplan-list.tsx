import React, { Fragment, useState, FC, useEffect } from 'react';
import { Theme, IconButton, Paper, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, Typography, CircularProgress, Card, CardContent } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { DoneAll as FinilizedIcon, Add as AddIcon, Edit as EditIcon, Clear as ClearIcon } from '@material-ui/icons';
import MahanIcon, { MahanIconType } from 'src/components/MahanIcon';
import Search, { filterOnProperties } from 'src/components/Search';
import NavBar from 'src/components/NavBar';
import persistant from 'src/utils/persistant';
import { useSnackbar } from 'notistack';
import ProgressSwitch from 'src/components/ProgressSwitch';
import classNames from 'classnames';
import PreplanHeader from 'src/business/preplan/PreplanHeader';
import NewPreplanHeaderModal, { useNewPreplanHeaderModalState } from 'src/components/preplan-list/NewPreplanHeaderModal';
import ClonePreplanHeaderModal, { useClonePreplanHeaderModalState } from 'src/components/preplan-list/ClonePreplanHeaderModal';
import EditPreplanHeaderModal, { useEditPreplanHeaderModalState } from 'src/components/preplan-list/EditPreplanHeaderModal';
import RemovePreplanHeaderModal, { useRemovePreplanHeaderModalState } from 'src/components/preplan-list/RemovePreplanHeaderModal';
import { useHistory } from 'react-router-dom';
import { useThrowApplicationError } from 'src/pages/error';
import MasterData from 'src/business/master-data';
import PreplanHeaderService from 'src/services/PreplanHeaderService';
import { useIsCompact } from 'src/utils/useResponsive';

const waitingPaperSize = 250;
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1
  },
  contentPage: {
    maxWidth: '1176px',
    margin: 'auto',
    [theme.breakpoints.down('xs')]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1)
    }
  },
  // Tabs + Search + Add button used to be crammed in one row (fine on a
  // wide screen, but the search box would get squeezed to nothing on a
  // phone). Below "sm" they stack: tab switcher on top, search + add below.
  headerControls: {
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
      alignItems: 'center'
    }
  },
  headerSearchRow: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1, 1, 1),
    [theme.breakpoints.up('sm')]: {
      flexGrow: 1,
      padding: 0
    }
  },
  headerSearchField: {
    flexGrow: 1
  },
  preplanTableCell: {
    paddingRight: theme.spacing(0),
    paddingLeft: theme.spacing(0),
    '&:last-child': {
      paddingRight: theme.spacing(0)
    },
    '&:first-child': {
      paddingLeft: theme.spacing(2)
    }
  },
  marginBottom1: {
    marginBottom: theme.spacing(1)
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary
  },
  progress: {
    position: 'relative',
    top: 50,
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  },
  waitingPaper: {
    height: waitingPaperSize
  },
  waitingPaperMessage: {
    lineHeight: `${waitingPaperSize}px`
  },
  messagePosition: {
    paddingTop: 40
  },
  error: {},
  switchProgressBar: {
    position: 'relative'
  },
  linkTableCell: {
    cursor: 'pointer'
  },
  publicHeader: {
    paddingLeft: 12
  },
  // Card styles used only on phones, replacing the 8-column table which
  // has no room to exist below ~600px.
  preplanCard: {
    marginBottom: theme.spacing(1)
  },
  preplanCardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  preplanCardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5, 2),
    marginTop: theme.spacing(1)
  },
  preplanCardMetaItem: {
    minWidth: '40%'
  },
  preplanCardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(1)
  }
}));

interface PreplanPublishSwitchLoadingStatus {
  [id: string]: boolean;
}

const PreplanListPage: FC = () => {
  const [preplanHeaders, setPreplanHeaders] = useState<PreplanHeader[]>([]);
  const [tab, setTab] = useState<'USER' | 'PUBLIC'>('USER');
  const [preplanLoading, setPrePlanLoading] = useState(false);
  const [preplanPublishSwitchLoadingStatus, setPreplanPublishSwitchLoadingStatus] = useState<PreplanPublishSwitchLoadingStatus>({});
  const [query, setQuery] = useState<readonly string[]>([]);

  const [newPreplanHeaderModalState, openNewPreplanHeaderModal, closeNewPreplanHeaderModal] = useNewPreplanHeaderModalState();
  const [clonePreplanHeaderModalState, openClonePreplanHeaderModal, closeClonePreplanHeaderModal] = useClonePreplanHeaderModalState();
  const [editPreplanHeaderModalState, openEditPreplanHeaderModal, closeEditPreplanHeaderModal] = useEditPreplanHeaderModalState();
  const [removePreplanHeaderModalState, openRemovePreplanHeaderModal, closeRemovePreplanHeaderModal] = useRemovePreplanHeaderModalState();

  const { enqueueSnackbar } = useSnackbar();
  const throwApplicationError = useThrowApplicationError();

  useEffect(() => {
    setPrePlanLoading(true);
    PreplanHeaderService.getAll()
      .then(preplanHeaderDataModels => {
        const preplanHeaders = preplanHeaderDataModels.map(p => new PreplanHeader(p));
        setPreplanHeaders(preplanHeaders);
      }, throwApplicationError.withTitle('Unable to fetch the list of preplans.'))
      .then(() => setPrePlanLoading(false));
  }, []);

  const history = useHistory();
  const classes = useStyles();
  const isCompact = useIsCompact();

  if (!MasterData.initialized) return <Fragment />;

  const filteredPreplanHeaders = filterOnProperties(preplanHeaders, query, 'name');
  const visibleHeaders = filteredPreplanHeaders.filter(p => (tab === 'USER' ? p.user.id === persistant.user!.id : p.user.id !== persistant.user!.id));

  async function handlePublishToggle(preplanHeader: PreplanHeader, checked: boolean) {
    if (preplanPublishSwitchLoadingStatus[preplanHeader.id]) return;
    setPreplanPublishSwitchLoadingStatus(state => ({ ...state, [preplanHeader.id]: true }));
    try {
      const preplanHeaderModels = await PreplanHeaderService.setPublished(preplanHeader.id, checked);
      const preplanHeaders = preplanHeaderModels.map(p => new PreplanHeader(p));
      setPreplanHeaders(preplanHeaders);
    } catch (reason) {
      enqueueSnackbar(String(reason), { variant: 'warning' });
    }
    setPreplanPublishSwitchLoadingStatus(state => ({ ...state, [preplanHeader.id]: false }));
  }

  return (
    <Fragment>
      <NavBar
        navBarLinks={[
          {
            title: 'Preplans',
            link: '/preplan-list'
          }
        ]}
      />

      <div className={classes.contentPage}>
        <div className={classes.headerControls}>
          <Tabs value={tab} indicatorColor="primary" textColor="primary" onChange={(event, tab) => setTab(tab)}>
            <Tab value="USER" label="Current User" />
            <Tab value="PUBLIC" label="Public" />
          </Tabs>
          <div className={classes.headerSearchRow}>
            <div className={classes.headerSearchField}>
              <Search onQueryChange={query => setQuery(query)} outlined />
            </div>
            <IconButton color="primary" title="Add Preplan" onClick={() => openNewPreplanHeaderModal({})}>
              <AddIcon fontSize="large" />
            </IconButton>
          </div>
        </div>

        {visibleHeaders.length > 0 ? (
          isCompact ? (
            <div>
              {visibleHeaders.map(preplanHeader => (
                <Card key={preplanHeader.id} className={classes.preplanCard}>
                  <CardContent onClick={() => history.push('preplan/' + preplanHeader.current.id)}>
                    <div className={classes.preplanCardTitleRow}>
                      <Typography variant="subtitle1">{preplanHeader.name}</Typography>
                      {preplanHeader.accepted && <FinilizedIcon fontSize="small" />}
                    </div>
                    {tab === 'PUBLIC' && (
                      <Typography variant="body2" color="textSecondary">
                        {preplanHeader.user.displayName}
                      </Typography>
                    )}
                    <div className={classes.preplanCardMeta}>
                      <Typography variant="body2" color="textSecondary" className={classes.preplanCardMetaItem}>
                        Last Modified: {preplanHeader.current.lastEditDateTime.format('d')}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" className={classes.preplanCardMetaItem}>
                        Created: {preplanHeader.creationDateTime.format('d')}
                      </Typography>
                      {preplanHeader.parentPreplanHeader && (
                        <Typography variant="body2" color="textSecondary" className={classes.preplanCardMetaItem}>
                          Copy Source: {preplanHeader.parentPreplanHeader.name}
                        </Typography>
                      )}
                      {preplanHeader.current.simulation && (
                        <Typography variant="body2" color="textSecondary" className={classes.preplanCardMetaItem}>
                          Simulation: {preplanHeader.current.simulation.name}
                        </Typography>
                      )}
                    </div>
                  </CardContent>
                  <div className={classes.preplanCardActions} onClick={e => e.stopPropagation()}>
                    {tab === 'USER' && (
                      <ProgressSwitch
                        checked={preplanHeader.published}
                        loading={preplanPublishSwitchLoadingStatus[preplanHeader.id]}
                        onChange={(event, checked) => handlePublishToggle(preplanHeader, checked)}
                      />
                    )}
                    <IconButton title="Copy Preplan" onClick={() => openClonePreplanHeaderModal({ preplanHeader })}>
                      <MahanIcon type={MahanIconType.CopyContent} />
                    </IconButton>
                    {tab === 'USER' && (
                      <Fragment>
                        <IconButton title="Edit Preplan" onClick={() => openEditPreplanHeaderModal({ preplanHeader })}>
                          <EditIcon />
                        </IconButton>
                        <IconButton title="Remove Preplan" onClick={() => openRemovePreplanHeaderModal({ preplanHeader })}>
                          <ClearIcon />
                        </IconButton>
                      </Fragment>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Paper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.preplanTableCell}>Name</TableCell>
                    {tab === 'PUBLIC' && <TableCell className={classes.preplanTableCell}>User</TableCell>}
                    <TableCell className={classes.preplanTableCell}>Last Modified</TableCell>
                    <TableCell className={classes.preplanTableCell}>Created at</TableCell>
                    <TableCell className={classes.preplanTableCell}>Copy Source</TableCell>
                    <TableCell className={classes.preplanTableCell}>Accepted</TableCell>
                    <TableCell className={classes.preplanTableCell}>Simulation Name</TableCell>
                    {tab === 'USER' && <TableCell className={classNames(classes.preplanTableCell, classes.publicHeader)}>Public</TableCell>}
                    <TableCell className={classes.preplanTableCell} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleHeaders.map(preplanHeader => (
                    <TableRow key={preplanHeader.id}>
                      <TableCell
                        onClick={() => history.push('preplan/' + preplanHeader.current.id)}
                        className={classNames(classes.preplanTableCell, classes.linkTableCell)}
                        component="th"
                        scope="row"
                      >
                        {preplanHeader.name}
                      </TableCell>

                      {tab === 'PUBLIC' && <TableCell className={classes.preplanTableCell}>{preplanHeader.user.displayName}</TableCell>}
                      <TableCell className={classes.preplanTableCell}>{preplanHeader.current.lastEditDateTime.format('d')}</TableCell>
                      <TableCell className={classes.preplanTableCell}>{preplanHeader.creationDateTime.format('d')}</TableCell>
                      <TableCell className={classes.preplanTableCell}>{preplanHeader.parentPreplanHeader && preplanHeader.parentPreplanHeader.name}</TableCell>
                      <TableCell className={classes.preplanTableCell} align="center">
                        {preplanHeader.accepted ? <FinilizedIcon /> : ''}
                      </TableCell>
                      <TableCell className={classes.preplanTableCell}>{preplanHeader.current.simulation && preplanHeader.current.simulation.name}</TableCell>

                      {tab === 'USER' && (
                        <TableCell className={classes.preplanTableCell} align="center">
                          <ProgressSwitch
                            checked={preplanHeader.published}
                            loading={preplanPublishSwitchLoadingStatus[preplanHeader.id]}
                            onChange={(event, checked) => handlePublishToggle(preplanHeader, checked)}
                          />
                        </TableCell>
                      )}

                      <TableCell className={classes.preplanTableCell} align="center">
                        <IconButton title="Copy Preplan" onClick={() => openClonePreplanHeaderModal({ preplanHeader })}>
                          <MahanIcon type={MahanIconType.CopyContent} />
                        </IconButton>
                        {tab === 'USER' && (
                          <Fragment>
                            <IconButton title="Edit Preplan" onClick={() => openEditPreplanHeaderModal({ preplanHeader })}>
                              <EditIcon />
                            </IconButton>
                            <IconButton title="Remove Preplan" onClick={() => openRemovePreplanHeaderModal({ preplanHeader })}>
                              <ClearIcon />
                            </IconButton>
                          </Fragment>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )
        ) : (
          <Paper className={classes.waitingPaper}>
            {preplanLoading ? (
              <CircularProgress size={24} className={classes.progress} />
            ) : (
              <Typography align="center" classes={{ root: classes.waitingPaperMessage }}>
                No preplans
              </Typography>
            )}
          </Paper>
        )}
      </div>

      <NewPreplanHeaderModal
        preplanHeaders={preplanHeaders}
        state={newPreplanHeaderModalState}
        onClose={closeNewPreplanHeaderModal}
        onCreate={async newPreplanHeaderModel => {
          const newPreplanId = await PreplanHeaderService.createEmpty(newPreplanHeaderModel);
          history.push(`/preplan/${newPreplanId}`);
        }}
      />

      <ClonePreplanHeaderModal
        preplanHeaders={preplanHeaders}
        state={clonePreplanHeaderModalState}
        onClose={closeClonePreplanHeaderModal}
        onClone={async clonePreplanHeaderModel => {
          const newPreplanId = await PreplanHeaderService.clone(clonePreplanHeaderModel);
          history.push(`/preplan/${newPreplanId}`);
        }}
      />

      <EditPreplanHeaderModal
        preplanHeaders={preplanHeaders}
        state={editPreplanHeaderModalState}
        onClose={closeEditPreplanHeaderModal}
        onApply={async editPreplanHeaderModel => {
          const preplanHeaderDataModels = await PreplanHeaderService.edit(editPreplanHeaderModel);
          const preplanHeaders = preplanHeaderDataModels.map(p => new PreplanHeader(p));
          setPreplanHeaders(preplanHeaders);
          closeEditPreplanHeaderModal();
        }}
      />

      <RemovePreplanHeaderModal
        state={removePreplanHeaderModalState}
        onClose={closeRemovePreplanHeaderModal}
        onRemove={async preplanHeaderId => {
          const preplanHeaderDataModels = await PreplanHeaderService.remove(preplanHeaderId);
          const preplanHeaders = preplanHeaderDataModels.map(p => new PreplanHeader(p));
          setPreplanHeaders(preplanHeaders);
          closeRemovePreplanHeaderModal();
        }}
      />
    </Fragment>
  );
};

export default PreplanListPage;
