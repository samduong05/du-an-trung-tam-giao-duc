import { useEffect, useRef, type ReactNode } from "react";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "../../store";
import { useLazyGetMeQuery } from "../../store/api/endpoints";
import {
  performLogout,
  setLoading,
  setUser,
} from "../../store/slices/authSlice";

interface AuthInitializerProps {
  children: ReactNode;
}

export default function AuthInitializer({
  children,
}: AuthInitializerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [getMe] = useLazyGetMeQuery();

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const initializeAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        dispatch(setLoading(false));
        return;
      }

      try {
        const response = await getMe().unwrap();

        console.log("GET ME RESPONSE:", response);

        dispatch(setUser(response.user));
      } catch (error) {
        console.error("AUTH INITIALIZER ERROR:", error);

        dispatch(performLogout());
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch, getMe]);

  return <>{children}</>;
}