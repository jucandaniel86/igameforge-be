export const useLog = (_data: any, _frontend: boolean) => {
  if (_frontend) {
    console.groupCollapsed(
      `%c API FRONTEND REQUEST                               `,
      "background: #C14803; color: white; display: block;"
    );
  } else {
    console.groupCollapsed(
      `%c API BACKEND RESPONSE                                `,
      "background: #039005; color: white; display: block;"
    );
  }
  console.log(_data);
  console.groupEnd();
};

export const useLogError = (_error: any) => {
  console.groupCollapsed(
    `%c API BACKEND ERROR                                `,
    "background: red; color: white; display: block;"
  );
  console.log(_error);
  console.groupEnd();
};
