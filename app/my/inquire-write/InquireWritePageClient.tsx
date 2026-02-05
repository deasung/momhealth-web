"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { createInquiry } from "../../../lib/api";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useTokenSync } from "../../../lib/hooks/useTokenSync";

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

export default function InquireWritePageClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { isTokenSynced } = useTokenSync();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 최초값 스냅샷(미저장 변경 감지용)
  const initialRef = useRef({ title: "", content: "" });
  useEffect(() => {
    initialRef.current = { title: "", content: "" };
  }, []);

  const onChangeTitle = useCallback((t: string) => {
    const next = t
      .replace(/\r\n?/g, "\n")
      .replace(/\n/g, " ")
      .slice(0, TITLE_MAX);
    setTitle(next);
  }, []);

  const onChangeContent = useCallback((t: string) => {
    const next = t.replace(/\r\n?/g, "\n").slice(0, CONTENT_MAX);
    setContent(next);
  }, []);

  const titleTrim = title.trim();
  const contentTrim = content.trim();

  const titleValid = titleTrim.length > 0;
  const contentValid = contentTrim.length > 0;
  const canSubmit = titleValid && contentValid && !submitting;
  const isDirty =
    title !== initialRef.current.title ||
    content !== initialRef.current.content;

  const handleClose = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm("작성 중인 내용이 사라집니다. 닫을까요?");
      if (!ok) return;
    }
    router.back();
  }, [isDirty, router]);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated || isLoading || !isTokenSynced) {
      window.alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!titleValid) {
      window.alert("제목을 입력해주세요.");
      return;
    }
    if (!contentValid) {
      window.alert("문의 내용을 입력해주세요.");
      return;
    }
    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);
      await createInquiry({ title: titleTrim, content: contentTrim });
      initialRef.current = { title, content };
      window.alert("문의가 등록되었습니다.");
      router.replace("/my/inquire");
    } catch (e: unknown) {
      const err = e as {
        response?: { status?: number; data?: { error?: string } };
      };
      const status = err?.response?.status;
      let msg = "문의 등록 중 오류가 발생했습니다.";
      if (status === 401) msg = "로그인이 필요합니다.";
      else if (status === 400)
        msg = err?.response?.data?.error || "입력 정보를 확인해주세요.";
      else if (status && status >= 500)
        msg = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      window.alert(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    isAuthenticated,
    isLoading,
    isTokenSynced,
    titleValid,
    contentValid,
    canSubmit,
    submitting,
    titleTrim,
    contentTrim,
    title,
    content,
    router,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="1:1 문의하기" description="궁금한 내용을 남겨주세요." />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-center">
          <div className="mb-8">
            <div className="text-gray-400 text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-8">
              1:1 문의를 작성하려면 로그인해주세요.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              로그인하기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="1:1 문의하기" description="궁금한 내용을 남겨주세요." />
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section className="mb-8 md:mb-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                1:1 문의하기
              </h1>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                궁금한 내용을 남겨주세요
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                등록
              </button>
            </div>
          </div>
        </section>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="문의 제목을 입력해주세요."
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              maxLength={TITLE_MAX}
              className={`w-full text-lg font-semibold text-gray-900 placeholder-gray-400 bg-transparent border-b focus:outline-none pb-2 ${
                !titleValid && title.length > 0
                  ? "border-red-400"
                  : "border-gray-200"
              }`}
            />
            <div
              className={`text-xs mt-2 text-right ${
                !titleValid && title.length > 0
                  ? "text-red-500"
                  : "text-gray-400"
              }`}
            >
              {title.length}/{TITLE_MAX}
            </div>
          </div>

          <div>
            <textarea
              placeholder={`문의하실 내용을 자세히 입력해주세요.\n\n답변을 받으시려면 정확한 연락처 정보를 함께 남겨주세요.`}
              value={content}
              onChange={(e) => onChangeContent(e.target.value)}
              maxLength={CONTENT_MAX}
              rows={10}
              className="w-full text-base text-gray-800 placeholder-gray-400 bg-transparent border border-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <div className="text-xs mt-2 text-gray-400 text-right">
              {content.length}/{CONTENT_MAX}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
