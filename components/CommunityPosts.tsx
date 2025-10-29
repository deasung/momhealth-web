import { CommunityPost } from "../types/home";
import { useRouter } from "next/router";
import Link from "next/link";

interface CommunityPostsProps {
  posts: CommunityPost[];
}

const CommunityPosts = ({ posts }: CommunityPostsProps) => {
  const router = useRouter();

  const handlePostClick = (postId: string | number) => {
    router.push(`/community/${postId}`);
  };
  const getTypeColor = (type: string) => {
    switch (type) {
      case "REVIEW":
        return "bg-green-100 text-green-800";
      case "QUESTION":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "REVIEW":
        return "후기";
      case "QUESTION":
        return "질문";
      default:
        return "게시글";
    }
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">커뮤니티</h2>
        <Link
          href="/community/list"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          전체보기 →
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {posts.map((post, index) => (
          <div
            key={post.id}
            onClick={() => handlePostClick(post.id)}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
              index === posts.length - 1 ? "border-b-0" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                    post.type
                  )}`}
                >
                  {getTypeLabel(post.type)}
                </span>
                <span className="text-sm text-gray-500">{post.timeAgo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>💬 {post.commentCount}</span>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
              {post.title}
            </h3>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {post.content}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                작성자: {post.authorName}
              </span>
              <span className="text-sm text-gray-400">
                {new Date(post.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CommunityPosts;
