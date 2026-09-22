import React from 'react';
import { UserRegistrationModal, UserRegistrationModalProps } from './UserRegistrationModal';

export type StudentRegistrationModalProps = UserRegistrationModalProps;

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = (props) => {
  return <UserRegistrationModal {...props} />;
};

export default StudentRegistrationModal;
