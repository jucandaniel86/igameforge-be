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
      customClass: { container: "app-alert" },
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
      customClass: { container: "app-alert" },
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
        customClass: { container: "app-alert" },
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

  const axiosErrorAlert = (error: any) => {
    const response = error?.response;
    const data = response?._data ?? response?.data ?? error?.data ?? error;
    const status = response?.status ?? data?.statusCode;
    const messages = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.flatMap(messages);
      return typeof value === "string" && value.trim() ? [value] : [];
    };

    let details = messages(data?.message);
    if (!details.length && data?.errors && typeof data.errors === "object") {
      details = Object.values(data.errors).flatMap(messages);
    }
    if (!details.length) details = messages(data?.error);
    if (!details.length) {
      details = [
        status === 403
          ? "You don't have access!"
          : status === 404
            ? "Request not found!"
            : "Something went wrong!",
      ];
    }

    // alertError renders HTML: escape server text before adding line breaks.
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    alertError(
      details
        .map((message) => message.replace(/[&<>"']/g, (char) => entities[char]))
        .join("<br />"),
    );
  };

  const alertSuccess = (message: string) => {
    fn.$swal.fire({
      title: "Success!!",
      html: message,
      icon: "success",
      customClass: { container: "app-alert" },
      confirmButtonText: "OK",
      toast: true,
    });
  };

  const alertError = (message: string) => {
    fn.$swal.fire({
      title: "Error!!",
      html: message,
      icon: "error",
      customClass: { container: "app-alert" },
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
