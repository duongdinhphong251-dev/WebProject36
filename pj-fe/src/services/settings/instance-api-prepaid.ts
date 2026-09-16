import createInstanceApiByUrl from './api';
import { getListFunctionByInstance } from './base-func-res-api';

const apiPrepaid = createInstanceApiByUrl(process.env.NEXT_PUBLIC_API);

export const funcApiPrepaid = getListFunctionByInstance(apiPrepaid);
