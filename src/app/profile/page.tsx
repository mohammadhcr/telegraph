import { LogoutButton } from "@/components/LogoutButton";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { FaUser } from "react-icons/fa6";
import styles from "../../styles/Profile.module.scss";

const Profile = async () => {
  const user = await currentUser();

  const { userProfile, userIcon, userPhoto, userName, userEmail, userPName } =
    styles;

  return (
    <div className="userWrapper">
      <div className={userProfile}>
        {user?.imageUrl ? (
          <Image
            className={userPhoto}
            src={user.imageUrl}
            width={260}
            height={260}
            alt="Avatar"
          />
        ) : (
          <FaUser className={userIcon} />
        )}
        <h2 className={userPName}>
          {user?.firstName || user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : ""}
        </h2>
        <h2 className={userName}>{user?.username}</h2>

        {user?.emailAddresses.map((email) => (
          <h3 className={userEmail} key={email.id}>
            {email.emailAddress}
          </h3>
        ))}

        <LogoutButton />
      </div>
    </div>
  );
};

export default Profile;
