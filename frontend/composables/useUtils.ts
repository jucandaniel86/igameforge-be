export const useUtils = () => {
  const removeDuplicates = (arr: any[], searchedKey: string) => {
    return arr.reduce((unique, o) => {
      if (!unique.some((obj: any) => obj[searchedKey] === o[searchedKey])) {
        unique.push(o);
      }
      return unique;
    }, []);
  };

  return {
    removeDuplicates,
  };
};
