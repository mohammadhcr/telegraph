import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

const SsoCallbackPage = () => {
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl="/chats"
      signUpFallbackRedirectUrl="/chats"
    />
  );
};

export default SsoCallbackPage;
