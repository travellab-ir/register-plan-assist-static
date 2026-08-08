import React, { Fragment, useState, FC, useEffect } from 'react';
import { Theme, IconButton, Paper, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, Typography, CircularProgress, Card, CardContent, Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { CheckCheck as FinilizedIcon, Plus as AddIcon, Pencil as EditIcon, X as ClearIcon, Copy as CopyIcon, Users as PublicIcon, User as UserIcon } from 'lucide-react';
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
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 0, 1.5, 0),
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(2)
    }
  },
  // A pill segmented-control reads as a deliberate, current piece of UI —
  // MUI's default underline Tabs is the thing every unstyled admin panel
  // ships with. The indicator is switched off; the selected Tab paints its
  // own pill background instead, so switching feels like a toggle, not a
  // page-navigation click.
  tabsRoot: {
    minHeight: 'auto',
    display: 'inline-flex',
    padding: 4,
    borderRadius: 999,
    backgroundColor: theme.palette.grey[100],
    border: `1px solid ${theme.palette.grey[200]}`
  },
  tabsFlexContainer: {
    gap: 2
  },
  tabRoot: {
    minHeight: 'auto',
    minWidth: 0,
    borderRadius: 999,
    padding: theme.spacing(0.75, 2),
    fontSize: '0.8125rem',
    fontWeight: 600,
    textTransform: 'none',
    color: theme.palette.text.secondary,
    transition: 'background-color 150ms ease, color 150ms ease',
    '&:hover': {
      color: theme.palette.primary.main
    }
  },
  tabSelected: {
    backgroundColor: theme.palette.common.white,
    color: theme.palette.primary.main,
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.12)'
  },
  tabWrapper: {
    flexDirection: 'row',
    gap: 6
  },
  headerSearchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      flexGrow: 1
    }
  },
  headerSearchField: {
    flexGrow: 1
  },
  // The bare "+" used to float unattached to anything, reading as an
  // afterthought. A filled, brand-colored circular button gives the primary
  // action real visual weight and ties it to the header's own palette.
  addButton: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    boxShadow: '0 4px 12px rgba(89, 107, 236, 0.35)',
    transition: 'transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: '0 6px 16px rgba(89, 107, 236, 0.45)',
      transform: 'translateY(-1px)'
    }
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
    height: waitingPaperSize,
    borderRadius: theme.spacing(1.5),
    backgroundColor: theme.palette.grey[50],
    border: `1px dashed ${theme.palette.grey[300]}`,
    boxShadow: 'none'
  },
  waitingPaperMessage: {
    lineHeight: `${waitingPaperSize}px`,
    color: theme.palette.text.secondary
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
    position: 'relative',
    display: 'flex',
    marginBottom: theme.spacing(1.5),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.grey[200]}`,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
    transition: 'box-shadow 150ms ease, border-color 150ms ease',
    '&:hover': {
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.1)',
      borderColor: theme.palette.grey[300]
    },
    '&:active': {
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)'
    }
  },
  // The single signature touch on this page: a slim status rail down the
  // left edge of every card. Its color is the one thing you can read at a
  // glance while scanning a long list — cyan for published/live plans,
  // neutral slate for private drafts — before any text registers.
  preplanCardRail: {
    flexShrink: 0,
    width: 4
  },
  preplanCardRailPublished: {
    backgroundColor: theme.palette.secondary.main
  },
  preplanCardRailPrivate: {
    backgroundColor: theme.palette.grey[300]
  },
  preplanCardBody: {
    flexGrow: 1,
    minWidth: 0
  },
  preplanCardContent: {
    paddingBottom: theme.spacing(1),
    '&:last-child': {
      paddingBottom: theme.spacing(1)
    }
  },
  preplanCardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    justifyContent: 'space-between'
  },
  preplanCardTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    minWidth: 0
  },
  preplanCardTitle: {
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  finalizedIcon: {
    flexShrink: 0,
    color: theme.palette.primary.main
  },
  ownerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.25)
  },
  preplanCardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.25, 2),
    marginTop: theme.spacing(1)
  },
  preplanCardMetaItem: {
    minWidth: '40%'
  },
  metaLabel: {
    display: 'block',
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: theme.palette.text.disabled
  },
  metaValue: {
    fontSize: '0.8125rem',
    color: theme.palette.text.primary
  },
  preplanCardActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.grey[100]}`
  },
  publishToggleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5)
  },
  publishToggleLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.palette.text.secondary
  },
  cardActionIcons: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderRadius: 999,
    backgroundColor: theme.palette.grey[50],
    border: `1px solid ${theme.palette.grey[200]}`
  },
  cardActionIconButton: {
    borderRadius: '50%',
    color: theme.palette.grey[700],
    transition: 'background-color 150ms ease, color 150ms ease',
    '&:hover': {
      backgroundColor: 'rgba(89, 107, 236, 0.1)',
      color: theme.palette.primary.main
    }
  },
  cardActionIconButtonDanger: {
    '&:hover': {
      backgroundColor: 'rgba(211, 47, 47, 0.1)',
      color: theme.palette.error.main
    }
  },
  statusChip: {
    height: 20,
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.02em'
  },
  statusChipPublished: {
    backgroundColor: 'rgba(0, 188, 212, 0.14)',
    color: '#00838F'
  },
  statusChipPrivate: {
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.secondary
  },
  tablePaper: {
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.grey[200]}`,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
    overflow: 'hidden'
  },
  tableHeadCell: {
    backgroundColor: theme.palette.grey[50],
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    borderBottom: `1px solid ${theme.palette.grey[200]}`
  },
  tableRow: {
    transition: 'background-color 120ms ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50]
    }
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
          <Tabs
            value={tab}
            onChange={(event, tab) => setTab(tab)}
            classes={{ root: classes.tabsRoot, flexContainer: classes.tabsFlexContainer }}
            TabIndicatorProps={{ style: { display: 'none' } }}
          >
            <Tab
              value="USER"
              label="Current User"
              icon={<UserIcon size={15} />}
              classes={{ root: classes.tabRoot, selected: classes.tabSelected, wrapper: classes.tabWrapper }}
            />
            <Tab
              value="PUBLIC"
              label="Public"
              icon={<PublicIcon size={15} />}
              classes={{ root: classes.tabRoot, selected: classes.tabSelected, wrapper: classes.tabWrapper }}
            />
          </Tabs>
          <div className={classes.headerSearchRow}>
            <div className={classes.headerSearchField}>
              <Search onQueryChange={query => setQuery(query)} outlined />
            </div>
            <IconButton className={classes.addButton} title="Add Preplan" onClick={() => openNewPreplanHeaderModal({})}>
              <AddIcon size={22} />
            </IconButton>
          </div>
        </div>

        {visibleHeaders.length > 0 ? (
          isCompact ? (
            <div>
              {visibleHeaders.map(preplanHeader => (
                <Card key={preplanHeader.id} className={classes.preplanCard} elevation={0}>
                  <div
                    className={classNames(classes.preplanCardRail, preplanHeader.published ? classes.preplanCardRailPublished : classes.preplanCardRailPrivate)}
                  />
                  <div className={classes.preplanCardBody}>
                    <CardContent className={classes.preplanCardContent} onClick={() => history.push('preplan/' + preplanHeader.current.id)}>
                      <div className={classes.preplanCardTitleRow}>
                        <div className={classes.preplanCardTitleGroup}>
                          {preplanHeader.accepted && <FinilizedIcon size={17} className={classes.finalizedIcon} />}
                          <Typography variant="subtitle1" className={classes.preplanCardTitle}>
                            {preplanHeader.name}
                          </Typography>
                        </div>
                        {tab === 'USER' && (
                          <Chip
                            label={preplanHeader.published ? 'Published' : 'Private'}
                            size="small"
                            className={classNames(classes.statusChip, preplanHeader.published ? classes.statusChipPublished : classes.statusChipPrivate)}
                          />
                        )}
                      </div>
                      {tab === 'PUBLIC' && (
                        <div className={classes.ownerRow}>
                          <UserIcon size={13} color="currentColor" />
                          <Typography variant="body2" color="textSecondary">
                            {preplanHeader.user.displayName}
                          </Typography>
                        </div>
                      )}
                      <div className={classes.preplanCardMeta}>
                        <div className={classes.preplanCardMetaItem}>
                          <Typography component="span" className={classes.metaLabel}>
                            Last Modified
                          </Typography>
                          <Typography component="span" className={classes.metaValue}>
                            {preplanHeader.current.lastEditDateTime.format('d')}
                          </Typography>
                        </div>
                        <div className={classes.preplanCardMetaItem}>
                          <Typography component="span" className={classes.metaLabel}>
                            Created
                          </Typography>
                          <Typography component="span" className={classes.metaValue}>
                            {preplanHeader.creationDateTime.format('d')}
                          </Typography>
                        </div>
                        {preplanHeader.parentPreplanHeader && (
                          <div className={classes.preplanCardMetaItem}>
                            <Typography component="span" className={classes.metaLabel}>
                              Copy Source
                            </Typography>
                            <Typography component="span" className={classes.metaValue}>
                              {preplanHeader.parentPreplanHeader.name}
                            </Typography>
                          </div>
                        )}
                        {preplanHeader.current.simulation && (
                          <div className={classes.preplanCardMetaItem}>
                            <Typography component="span" className={classes.metaLabel}>
                              Simulation
                            </Typography>
                            <Typography component="span" className={classes.metaValue}>
                              {preplanHeader.current.simulation.name}
                            </Typography>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className={classes.preplanCardActions} onClick={e => e.stopPropagation()}>
                      {tab === 'USER' ? (
                        <div className={classes.publishToggleGroup}>
                          <ProgressSwitch
                            checked={preplanHeader.published}
                            loading={preplanPublishSwitchLoadingStatus[preplanHeader.id]}
                            onChange={(event, checked) => handlePublishToggle(preplanHeader, checked)}
                          />
                          <Typography className={classes.publishToggleLabel}>{preplanHeader.published ? 'Published' : 'Publish'}</Typography>
                        </div>
                      ) : (
                        <span />
                      )}
                      <div className={classes.cardActionIcons}>
                        <IconButton
                          className={classes.cardActionIconButton}
                          size="small"
                          title="Copy Preplan"
                          onClick={() => openClonePreplanHeaderModal({ preplanHeader })}
                        >
                          <CopyIcon size={17} />
                        </IconButton>
                        {tab === 'USER' && (
                          <Fragment>
                            <IconButton
                              className={classes.cardActionIconButton}
                              size="small"
                              title="Edit Preplan"
                              onClick={() => openEditPreplanHeaderModal({ preplanHeader })}
                            >
                              <EditIcon size={17} />
                            </IconButton>
                            <IconButton
                              className={classNames(classes.cardActionIconButton, classes.cardActionIconButtonDanger)}
                              size="small"
                              title="Remove Preplan"
                              onClick={() => openRemovePreplanHeaderModal({ preplanHeader })}
                            >
                              <ClearIcon size={17} />
                            </IconButton>
                          </Fragment>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Paper className={classes.tablePaper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell)}>Name</TableCell>
                    {tab === 'PUBLIC' && <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell)}>User</TableCell>}
                    <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell)}>Last Modified</TableCell>
                    <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell)}>Created at</TableCell>
                    <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell)}>Copy Source</TableCell>
                    <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell)}>Accepted</TableCell>
                    <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell)}>Simulation Name</TableCell>
                    {tab === 'USER' && (
                      <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell, classes.publicHeader)}>Public</TableCell>
                    )}
                    <TableCell className={classNames(classes.preplanTableCell, classes.tableHeadCell)} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleHeaders.map(preplanHeader => (
                    <TableRow key={preplanHeader.id} className={classes.tableRow}>
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
                        {preplanHeader.accepted ? <FinilizedIcon size={18} className={classes.finalizedIcon} /> : ''}
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
                        <div className={classes.cardActionIcons} style={{ display: 'inline-flex' }} onClick={e => e.stopPropagation()}>
                          <IconButton
                            className={classes.cardActionIconButton}
                            size="small"
                            title="Copy Preplan"
                            onClick={() => openClonePreplanHeaderModal({ preplanHeader })}
                          >
                            <CopyIcon size={17} />
                          </IconButton>
                          {tab === 'USER' && (
                            <Fragment>
                              <IconButton
                                className={classes.cardActionIconButton}
                                size="small"
                                title="Edit Preplan"
                                onClick={() => openEditPreplanHeaderModal({ preplanHeader })}
                              >
                                <EditIcon size={17} />
                              </IconButton>
                              <IconButton
                                className={classNames(classes.cardActionIconButton, classes.cardActionIconButtonDanger)}
                                size="small"
                                title="Remove Preplan"
                                onClick={() => openRemovePreplanHeaderModal({ preplanHeader })}
                              >
                                <ClearIcon size={17} />
                              </IconButton>
                            </Fragment>
                          )}
                        </div>
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
