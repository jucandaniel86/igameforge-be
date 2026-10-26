import { useLog, useLogError } from "./useLog";
import { useAuthRequest } from "./useAuthRequest";

export type useAPIFetchType = {
  success: boolean;
  error: any;
  data: any;
};

export const useAPIFetch = async (
  path: any,
  _payload: any = {},
  _blob: boolean = false,
): Promise<useAPIFetchType> => {
  const request = useAuthRequest();
  const config = useRuntimeConfig();
  const options: any = {};
  let _return: useAPIFetchType = {
    success: true,
    data: null,
    error: null,
  };

  options.baseURL = config.public.baseURL;
  options.query = _payload;
  if (_blob) {
    options.responseType = "blob";
  }

  useLog(
    {
      path: options.baseURL + path,
      params: _payload,
    },
    true,
  );

  try {
    _return.data = await request(path, options);
    useLog(_return, false);
    return _return;
  } catch (err) {
    useLogError(err);
    _return.success = false;
    _return.error = err;
    return _return;
  }
};
