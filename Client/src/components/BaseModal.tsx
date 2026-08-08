import React, { FC, ReactElement, useState, KeyboardEvent } from 'react';
import { Theme, DialogTitle, DialogContent, DialogActions, Button, IconButton, CircularProgress, Paper, Typography } from '@material-ui/core';
import { X as CloseIcon } from 'lucide-react';
import { makeStyles } from '@material-ui/styles';
import DraggableDialog, { DraggableDialogProps } from 'src/components/DraggableDialog';
import { useIsCompact } from 'src/utils/useResponsive';
import classNames from 'classnames';

const useStyles = makeStyles((theme: Theme) => ({
  // Full-screen mobile dialogs (see DraggableDialog) have no backdrop to tap
  // and, for most modals, no Escape/backdrop-dismiss either — see the
  // `cancelable` prop below. Reserve room for an explicit close (✕) button
  // so there's always a visible way out without hunting for the Cancel
  // action, which can be scrolled off-screen on a tall form.
  dialogTitleWithClose: {
    position: 'relative',
    paddingRight: theme.spacing(7)
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1)
  },
  progress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  },
  disable: {
    opacity: 0.5
  },
  message: {
    display: 'flex',
    alignItems: 'center'
  },
  marginTop2: {
    marginTop: theme.spacing(2)
  },
  error: {
    padding: theme.spacing(1.5, 1.5, 1.5, 3)
  },
  paperError: {
    boxShadow: '0px 1px 3px 0px rgba(255, 0, 0, 0.2), 0px 1px 1px 0px rgba(255, 0, 0, 0.14), 0px 2px 1px -1px rgba(255, 0, 0, 0.12)'
  },
  marginRight1: {
    marginRight: theme.spacing(1)
  }
}));

export interface ModalAction {
  title: string;
  submitter?: boolean;
  canceler?: boolean;
  notClosing?: boolean;
  invisible?: boolean;
  disabled?: boolean;
  action?(): void | Promise<void>;
}

export interface BaseModalProps<State> extends Omit<DraggableDialogProps, 'open' | 'title'> {
  state: State;
  onClose(): void | Promise<void>;
}

interface Supplement {
  handleKeyboardEvent(e?: KeyboardEvent): void;
  submit(): void;
  cancel(): void;
  loading(loading?: boolean): boolean;
  errorMessage(errorMessage?: string): string;
}
interface ActualBaseModalProps extends Omit<BaseModalProps<any>, 'state'> {
  cancelable?: boolean;
  title?: string;
  complexTitle?: ReactElement | undefined | null | false;
  body(supplement: Supplement): JSX.Element;
  actions?: ModalAction[];
}

const BaseModal: FC<ActualBaseModalProps> = ({ cancelable, title, complexTitle, body, onClose, actions, ...others }) => {
  const [{ loading, errorMessage }, setViewState] = useState<{ loading: boolean; errorMessage: string }>({ loading: false, errorMessage: '' });

  const supplement: Supplement = {
    handleKeyboardEvent(e) {
      if (e && (e.altKey || e.ctrlKey || e.shiftKey)) return;
      switch (e?.which) {
        case 13:
          supplement.submit();
          break;
        case 27:
          supplement.cancel();
          break;
      }
    },
    submit() {
      const action = actions?.last(a => !a.disabled && !a.invisible && a.submitter);
      if (!action) return;
      handleLoader(fullAction(action))();
    },
    cancel() {
      const action = actions?.last(a => !a.disabled && !a.invisible && a.canceler);
      if (!action) return;
      handleLoader(fullAction(action))();
    },
    loading(_loading?: boolean): boolean {
      if (_loading === undefined) return loading;
      setViewState({ loading: _loading, errorMessage });
      return _loading;
    },
    errorMessage(_errorMessage?: string): string {
      if (_errorMessage === undefined) return errorMessage;
      setViewState({ loading, errorMessage: _errorMessage });
      return _errorMessage;
    }
  };

  const classes = useStyles();
  const isCompact = useIsCompact();

  // Same action the Cancel button (or Escape/backdrop, where allowed) already
  // triggers. Reusing it means the close button can't skip any per-modal
  // cancel logic or appear when there's genuinely nothing to cancel with.
  const hasCancelAction = !!actions?.some(action => action.canceler && !action.invisible);
  const showCloseButton = isCompact && hasCancelAction;

  return (
    <DraggableDialog
      {...others}
      aria-labelledby="form-dialog-title"
      open={true}
      disableBackdropClick={loading || !cancelable}
      disableEscapeKeyDown={loading || !cancelable}
      onClose={handleLoader(onClose)}
    >
      <DialogTitle
        className={classNames(loading ? classes.disable : '', showCloseButton ? classes.dialogTitleWithClose : '')}
        id="form-dialog-title"
        disableTypography={showCloseButton}
      >
        {showCloseButton ? (
          // Swap the heading tag DialogTitle would normally render (<h6>) for a
          // <div> here only, since a heading can't legally contain the block-level
          // markup some `complexTitle`s are built from. Desktop keeps the default.
          <Typography variant="h6" component="div">
            {title || complexTitle}
          </Typography>
        ) : (
          title || complexTitle
        )}
        {showCloseButton && (
          <IconButton className={classes.closeButton} onClick={supplement.cancel} disabled={loading} title="Close" aria-label="close">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <div className={classNames(loading ? classes.disable : '')}>{body(supplement)}</div>
        {loading && <CircularProgress size={24} className={classes.progress} />}
        {errorMessage && (
          <Paper className={classNames(classes.paperError, classes.marginTop2)}>
            <Typography className={classes.error} component="p" variant="body1" color="error">
              {errorMessage}
            </Typography>
          </Paper>
        )}
      </DialogContent>
      {actions && (
        <DialogActions className={classes.marginRight1}>
          {actions
            .filter(action => !action.invisible)
            .map((action, index) => (
              <Button key={index} color="primary" disabled={action.disabled || loading} onClick={handleLoader(fullAction(action))}>
                {action.title}
              </Button>
            ))}
        </DialogActions>
      )}
    </DraggableDialog>
  );

  function fullAction({ action, notClosing }: ModalAction): () => Promise<void> {
    return async () => {
      if (!action) return onClose();
      try {
        await action();
        if (notClosing) return;
        return onClose();
      } catch (reason) {
        // No need to close the modal when some exception occurs in the action.
        console.error(reason);
        throw reason;
      }
    };
  }

  function handleLoader(action: () => void | Promise<void>): () => void {
    return () => {
      const result = action();
      if (!(result instanceof Promise)) {
        if (!loading && !errorMessage) return;
        setViewState({ loading: false, errorMessage: '' });
        return;
      }
      setViewState({ loading: true, errorMessage: '' });
      result.then(
        () => setViewState({ loading: false, errorMessage: '' }),
        reason => setViewState({ loading: false, errorMessage: String(reason) })
      );
    };
  }
};

export default BaseModal;

export function useModalState<State>(): [State | undefined, (state: State) => void, () => void] {
  const [state, setState] = useState<State | undefined>(undefined);
  return [state, state => setState(state), () => setState(undefined)];
}

export function createModal<State, ModalProps extends BaseModalProps<State>>(Modal: FC<ModalProps>): FC<Omit<ModalProps, 'state'> & { state: State | undefined }> {
  return ({ state, ...others }) => (state ? <Modal {...(others as any)} state={state} /> : <DraggableDialog open={false} />);
}
