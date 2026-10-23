export type AlertConfirmType = {
  text: string;
  onClick?: (_result: any) => void;
};

export type SwallConfirmType = {
  isConfirmed: boolean;
  isDenied: boolean;
  isDismissed: boolean;
  value: boolean;
};

export const useAlert = () => {
  const fn: any = getCurrentInstance()?.appContext.config.globalProperties;

  const confirmDelete = async (cb: any) => {
    const swal = new fn.$swal({
      title: "Confirm",
      text: "Are you sure you want to delete this entry?",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete it!",
      cancelButtonText: "Cancel",
    });
    swal.then(async (result: SwallConfirmType) => {
      if (typeof cb === "function" && result.isConfirmed) {
        await cb(result);
      }
    });
  };

  const confirm = ({ text, onClick }: AlertConfirmType) => {
    const swal = new fn.$swal({
      title: "Confirm",
      text,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes!",
    });

    swal.then(async (result: SwallConfirmType) => {
      if (typeof onClick === "function" && result.isConfirmed) {
        onClick(result);
      }
    });
  };

  const confirmAsync = async (text: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const swal = new fn.$swal({
        title: "Confirm",
        text,
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Yes!",
        cancelButtonText: "Cancel",
      });

      swal.then((result: SwallConfirmType) => {
        if (result.isConfirmed) {
          resolve(true);
        } else {
          reject(false);
        }
      });
    });
  };

  const axiosErrorAlert = (_data: any) => {
    let message = "";
    if (typeof _data.response === "undefined") {
      return alertError("Something went wrong!");
    }

    switch (_data.response.status) {
      case 500:
        message = _data.response._data.message;
        break;
      case 422:
        if (typeof _data.response._data.errors === "object") {
          message = Object.entries(_data.response._data.errors)
            .map((error) => error[1])
            .join("<br />");
        } else if (typeof _data.response._data.message !== "undefined") {
          message = _data.response.data.message;
        }
        break;
      case 403:
        message = "You don't have access!";
        break;
      case 404:
        message = "Request not found!";
        break;
      default:
        message = _data.response.data.error;
    }
    alertError(message);
  };

  const alertSuccess = (message: string) => {
    fn.$swal.fire({
      title: "Success!!",
      html: message,
      icon: "success",
      confirmButtonText: "OK",
      toast: true,
    });
  };

  const alertError = (message: string) => {
    fn.$swal.fire({
      title: "Error!!",
      html: message,
      icon: "error",
      confirmButtonText: "OK",
      toast: true,
    });
  };

  const alertWarning = (message: string) => {
    fn.$swal.fire("Warning!!", message, "warning");
  };

  return {
    confirmDelete,
    alertSuccess,
    alertError,
    alertWarning,
    axiosErrorAlert,
    confirm,
    confirmAsync,
  };
};
