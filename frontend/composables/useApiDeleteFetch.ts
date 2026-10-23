import { useLog, useLogError } from "./useLog";
import { useAuthStore } from "~/store/auth";

export type useAPIFetchType = {
  success: boolean;
  error: any;
  data: any;
};

export const useApiDeleteFetch = async (
  path: any,
  _payload: any = {}
): Promise<useAPIFetchType> => {
  const { token } = storeToRefs(useAuthStore());
  const config = useRuntimeConfig();
  const options: any = {};
  let _return: useAPIFetchType = {
    success: true,
    data: null,
    error: null,
  };

  options.baseURL = config.public.baseURL;
  options.query = _payload;
  options.method = "delete";
  //@ts-ignore
  options.onRequest = ({ request, options }) => {
    options.headers.set("Authorization", `Bearer ${token.value}`);
    options.headers.set("content-type", "application/json");
  };

  useLog(
    {
      path: options.baseURL + path,
      params: _payload,
    },
    true
  );

  try {
    _return.data = await $fetch(path, options);
    useLog(_return, false);
    return _return;
  } catch (err) {
    useLogError(err);
    _return.success = false;
    _return.error = err;
    return _return;
  }
};
