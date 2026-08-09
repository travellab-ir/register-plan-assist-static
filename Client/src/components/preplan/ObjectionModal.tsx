import React, { Fragment, useContext } from 'react';
import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import BaseModal, { BaseModalProps, useModalState, createModal } from 'src/components/BaseModal';
import Objectionable from 'src/business/constraints/Objectionable';
import ObjectionList from 'src/components/preplan/ObjectionList';
import { PreplanContext } from 'src/pages/preplan';

const useStyles = makeStyles((theme: Theme) => ({}));

export interface ObjectionModalState {
  target: Objectionable;
}

export interface ObjectionModalProps extends BaseModalProps<ObjectionModalState> {}

const ObjectionModal = createModal<ObjectionModalState, ObjectionModalProps>(({ state, onClose, ...others }) => {
  const classes = useStyles();
  const preplan = useContext(PreplanContext);

  const objections = state.target ? preplan.constraintSystem.getObjectionsByTargets(state.target) : [];

  return (
    <BaseModal
      {...others}
      onClose={onClose}
      title={state.target ? `The list of objections on ${state.target.marker}:` : ''}
      actions={[
        {
          title: 'Close',
          submitter: true,
          canceler: true
        }
      ]}
      body={() => <Fragment>{objections.length > 0 ? <ObjectionList objections={objections} onClick={() => onClose()} /> : <Fragment>No objections.</Fragment>}</Fragment>}
    />
  );
});

export default ObjectionModal;

export function useObjectionModalState() {
  return useModalState<ObjectionModalState>();
}
