import React, { Suspense } from "react";
import ChatsPage from "./main";

const page = () => {
  return (
    <Suspense>
      <ChatsPage />
    </Suspense>
  );
};

export default page;
