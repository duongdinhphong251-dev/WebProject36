export function handleCommonApiErrors(
  error: any,
  errorCodes: Array<string | number>,
): boolean {
  const statusCode = error?.response?.data?.status_code;
  return !!statusCode && errorCodes.includes(statusCode);
}

export async function parseErrorResponse(res: Response): Promise<any> {
  const errorObj: any = {
    status: res.status,
    statusText: res.statusText,
  };

  try {
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      errorObj.obj = await res.clone().json();
    } else {
      errorObj.obj = await res.clone().text();
    }
  } catch (err) {
    console.warn('⚠️ Error reading response body:', err);
    errorObj.obj = 'error';
  }

  return errorObj;
}

export const formatErrorMessage = (message: any) => {
  if (!message) {
    return 'An unexpected error occurred';
  }

  if (message instanceof Error) {
    return message.message;
  }

  if (typeof message === 'string') {
    return message;
  }

  if (typeof message === 'object') {
    return Object.entries(message)
      .map(([field, messages]) =>
        Array.isArray(messages) ? `${field}: ${messages.join(', ')}` : `${field}: ${messages}`,
      )
      .join('; ');
  }

  return 'An unexpected error occurred';
};
