import createInstanceApiByUrl from './api';
import { getListFunctionByInstance } from './base-func-res-api';

const apiAuth = createInstanceApiByUrl(process.env.NEXT_PUBLIC_API, false);

export const funcApiAuth = getListFunctionByInstance(apiAuth);
