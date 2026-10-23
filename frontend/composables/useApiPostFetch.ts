import { useAuthStore } from "~/store/auth";
import { useLog, useLogError } from "./useLog";

export type useApiFetchType = {
  success: boolean;
  error: any;
  data: any;
	message?: string | string[]
};

export const useApiPostFetch = async (
  path: any,
  _payload: any = {},
	removeApi: boolean = false
): Promise<useApiFetchType> => {
  const config = useRuntimeConfig();
  const { token } = storeToRefs(useAuthStore());
  const options: any = {};
  let _return: useApiFetchType = {
    success: true,
    data: null,
    error: null, 
  };

  options.baseURL = (removeApi) ? config.public.baseURL.replace('/api', '') :  config.public.baseURL;
  options.body = { ..._payload };
  options.method = "post";
  options.watch = false;

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
  } catch (err: any) {
    //@ts-ignore
    useLogError(err.data);
    _return.success = false;
    _return.error = err;
		if(err.data.message) _return.message = err?.data?.message
	  return _return;
  }
};
