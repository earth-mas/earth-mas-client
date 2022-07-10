import { AxiosResponse } from 'axios';
import { Dispatch, SetStateAction } from 'react';
import { UseMutateFunction } from 'react-query';

export interface ISupportPaymentUIProps {
  paymentData: any;
  isComplete: boolean;
  data: {
    title: string;
    user: {
      name: string;
    };
  };
  setSelectAmount: Dispatch<SetStateAction<string>>;
  selectAmount: string;
  onClickPayment: (e: { preventDefault: () => void }) => void;
  supportPayment: UseMutateFunction<
    AxiosResponse<any, any>,
    unknown,
    { imp_uid: string }
  >;
}
