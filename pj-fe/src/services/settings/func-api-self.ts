import { Env } from '@/libs/Env';
import createInstanceApiByUrl from './api';
import { getListFunctionByInstance } from './base-func-res-api';

const apiSelf = createInstanceApiByUrl(`${Env.SELT_API}/api`);

export const internalApiFuncs = getListFunctionByInstance(apiSelf);
