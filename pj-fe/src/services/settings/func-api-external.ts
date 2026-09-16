import { Env } from '@/libs/Env';
import createInstanceApiByUrl from './api';
import { getListFunctionByInstance } from './base-func-res-api';

const apiSelf = createInstanceApiByUrl(`${Env.EXTERNAL_API}/api`);

export const externalApiFuncs = getListFunctionByInstance(apiSelf);
