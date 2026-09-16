/* eslint-disable prefer-promise-reject-errors */
import type { AxiosRequestConfig } from 'axios';
import { HTTP_OK } from '@/constants/http-status';

type RequestOptions = {} & AxiosRequestConfig;

const formatMessageData = (message: any) => {
  if (typeof message === 'string') {
    return message;
  }
  return JSON.stringify(message);
};

const handleResponse = (response: any) => {
  if (!response || !response?.data || response?.status !== HTTP_OK) {
    const message = formatMessageData(response?.data?.message || `Unexpected response code: ${response?.data?.code}`);
    const error: any = new Error(message);
    error.response = response;
    return Promise.reject(error);
  }

  return response.data;
};

const handleAxiosError = (error: any) => {
  if (error.response) {
    const message = formatMessageData(error.response.data?.message || error.response.statusText || `Server responded with a status code ${error.response.status}`);
    return Promise.reject({
      message,
      response: error.response,
    });
  }
  if (error.request) {
    return Promise.reject({
      message: 'No response received from server',
      request: error.request,
    });
  }

  return Promise.reject({
    message: `Request error: ${error.message}`,
    request: error.request,
  });
};

export const getListFunctionByInstance = (instance: any) => {
  return {
    getByRouter: async function getByRouter(router: string, params?: any, options: RequestOptions = {}) {
      try {
        const response = await instance.get(router, { params, ...options });

        return handleResponse(response);
      } catch (error) {
        return handleAxiosError(error);
      }
    },
    postByRouter: async function postByRouter(router: string, data: any = {}, options: RequestOptions = {}) {
      try {
        const response = await instance.post(router, data, options);
        return handleResponse(response);
      } catch (error) {
        return handleAxiosError(error);
      }
    },
    putByRouter: async function putByRouter(router: string, data: any = {}, options: any = {}) {
      try {
        // Send the request with the updated FormData and options
        const response = await instance.put(router, data, options);

        return handleResponse(response);
      } catch (error) {
        return handleAxiosError(error);
      }
    },
    deleteByRouter: async function deleteByRouter(router: string, params: any = {}, options: RequestOptions = {}) {
      try {
        const response = await instance.delete(router, { params, ...options });
        return handleResponse(response);
      } catch (error) {
        return handleAxiosError(error);
      }
    },
    patchByRouter: async function patchByRouter(router: string, data: any = {}, options: RequestOptions = {}, pathParams?: any) {
      try {
        if (pathParams) {
          for (const key in pathParams) {
            if (Object.prototype.hasOwnProperty.call(pathParams, key)) {
              router = router.replace(`{${key}}`, pathParams[key]);
            }
          }
        }

        const response = await instance.patch(router, data, options);
        return handleResponse(response);
      } catch (error) {
        return handleAxiosError(error);
      }
    },
  };
};
