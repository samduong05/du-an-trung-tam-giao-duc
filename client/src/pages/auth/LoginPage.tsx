import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
// import { useWindowTitle } from "../../hooks";
// import Logo from "../../components/ui/Logo";
import { useLoginMutation } from "../../store/api/endpoints";
import { setCredentials } from "../../store/slices/authSlice";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  //   useWindowTitle("Đăng nhập");

  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await login(data).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.token,
        }),
      );

      toast.success(`Chào mừng ${response.user.name}`);

      switch (response.user.role) {
        case "admin":
          navigate("/admin", { replace: true });
          break;

        case "teacher":
          navigate("/teacher", { replace: true });
          break;

        case "student":
          navigate("/student", { replace: true });
          break;

        default:
          toast.error("Tài khoản không có vai trò hợp lệ");
          navigate("/auth/login", { replace: true });
      }
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-bg-secondary border-r border-white/5">
        {/* Animated gradient */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[80px] animate-pulse-glow" />

          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-purple-500/15 rounded-full blur-[60px]" />
        </div>

        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* <Logo size={40} /> */}

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="animate-fade-up">
             <h1 className="font-sans font-bold text-4xl text-text-primary leading-tight tracking-normal mb-4">
                Quản lý trung tâm tiếng Anh dễ dàng hơn
              </h1>

              <p className="text-text-secondary leading-relaxed">
                Quản lý học sinh, giáo viên, lớp học, điểm danh, bài tập và kết
                quả học tập trong một hệ thống duy nhất.
              </p>
            </div>

            <div className="mt-10 space-y-4 animate-fade-up animate-fade-up-delay-1">
              {[
                {
                  label: "Quản lý lớp học và học viên",
                  color: "#10B981",
                },
                {
                  label: "Theo dõi điểm danh và kết quả học tập",
                  color: "#0066FF",
                },
                {
                  label: "Bài tập, tài liệu và bài kiểm tra trực tuyến",
                  color: "#F59E0B",
                },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: feature.color }}
                  />

                  <span className="text-sm text-text-secondary">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-text-tertiary">
            English Center Learning Management System
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 lg:max-w-lg flex flex-col justify-center px-8 md:px-12 lg:px-16">
        <div className="lg:hidden mb-10">
          {/* <Logo size={36} glow={false} /> */}
        </div>

        <div className="animate-fade-up">
          <h2 className="font-sans font-bold text-3xl text-text-primary tracking-normal">
            Chào mừng trở lại
          </h2>

          <p className="text-text-secondary mt-2 text-sm">
            Đăng nhập để tiếp tục sử dụng hệ thống
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-10 space-y-5 animate-fade-up animate-fade-up-delay-1"
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-text-secondary uppercase tracking-wider"
            >
              Email
            </label>

            <input
              id="email"
              {...register("email")}
              type="email"
              placeholder="example@gmail.com"
              className="input"
              autoComplete="email"
              disabled={isLoading}
            />

            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-text-secondary uppercase tracking-wider"
              >
                Mật khẩu
              </label>

              <Link
                to="/auth/forgot-password"
                className="text-xs text-accent hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="input pr-11"
                autoComplete="current-password"
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errors.password && (
              <p className="text-danger text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center mt-2"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}

            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-text-tertiary animate-fade-up animate-fade-up-delay-2">
          Tài khoản được cấp bởi quản trị viên hoặc giáo viên của trung tâm.
        </p>
      </div>
    </div>
  );
}
