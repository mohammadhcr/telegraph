import styles from "../../styles/Article.module.scss";
import supabase from "@/supabase";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telegraph | Chats",
};

interface Chat {
  id: number;
  userName: string;
}

const Article = async () => {
  const userObj = await currentUser();

  const userId = userObj?.id;

  const { data: chats } = await supabase
    .from("chats")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  const otherUserIds =
    chats?.map((chat) =>
      chat.user1_id === userId ? chat.user2_id : chat.user1_id,
    ) || [];

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .in("id", otherUserIds);

  const { wrapper, commentContainer, commentWrapper, commentSection } = styles;

  return (
    <div className={wrapper}>
      {users!.map((contact: Chat) => (
        <div className={commentWrapper} key={contact.id}>
          <div className={commentContainer}>
            <div className={commentSection}>
              <h2>{contact.userName}</h2>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Article;
