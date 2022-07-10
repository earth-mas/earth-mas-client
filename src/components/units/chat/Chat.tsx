import { ChatContainer } from './ChatContainer';
import { ChatList } from './ChatList';
import {
  ChatWrapper,
  ContainerWrapper,
  LeftContainer,
  RightContainer,
} from './Chat.styles';
import { useEffect, useRef, useState } from 'react';
import { userState } from 'recoil/user';
import { useRecoilValue } from 'recoil';
import { chat } from 'utils/APIRoutes';
import { io } from 'socket.io-client';
import { BeforeChat } from './BeforeChat';
import axios from 'axios';
import { useQuery } from 'react-query';
import store from 'storejs';
import Scrollbars from 'react-custom-scrollbars';
import makeList from 'utils/makeList';
import { ChatInput } from './ChatInput';

export const Chat = () => {
  const userInfo = useRecoilValue(userState);
  const accessToken = store.get('accessToken');

  const [currentUser, setCurrentUser] = useState<any>(undefined);
  const [currentChat, setCurrentChat] = useState<any>(undefined);

  const socketRef = useRef<any>(null);
  const scrollbarRef = useRef<Scrollbars>(null);

  const roomId = currentChat?.roomId;

  useEffect(() => {
    if (userInfo.id.length > 0) return setCurrentUser(userInfo);
  }, [userInfo]);

  useEffect(() => {
    socketRef.current = io(`${chat}`, {
      upgrade: false,
    });
    if (currentUser && currentChat?.chat === 0) {
      socketRef.current.emit('user-enter', {
        roomid: currentChat?.roomId,
      });
    } else {
      socketRef.current.emit('room-enter', {
        roomid: currentChat?.roomId,
      });
    }

    setTimeout(() => {
      scrollbarRef.current?.scrollToBottom();
    }, 100);
  }, [currentChat]);

  const groupChat = async () => {
    const res = await axios.post(`${chat}/get-my-roomchat`, null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.data?.map((el: any) => {
      return {
        chat: 1,
        user: {
          id: el?.[0]?.id,
          url: el?.[0]?.url,
          name: el?.[0]?.description.replace(/[<]+[a-zA-Z/]+[>]/gi, ''),
        },
        roomId: el?.[0]?.id,
        content: el?.[1]?.content,
        updatedAt: el?.[1]?.createdAt
          ? el?.[1]?.createdAt
          : el?.[0]?.activityjoin?.[0].createAt,
      };
    });
  };
  const { data: groupChatList } = useQuery('getmyroomchat', groupChat);

  const personalChat = async () => {
    const res = await axios.get(`${chat}/findmychat`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.data?.map((el: any) => {
      return {
        chat: 0,
        user:
          el?.[0]?.user1?.id !== userInfo.id
            ? {
                id: el?.[0]?.user1?.id,
                url: el?.[0]?.user1?.url,
                name: el?.[0]?.user1?.name,
              }
            : {
                id: el?.[0]?.user2?.id,
                url: el?.[0]?.user2?.url,
                name: el?.[0]?.user2?.name,
              },
        roomId: el?.[0]?.id,
        content: el?.[1]?.content,
        updatedAt: el?.[1]?.createdAt ? el?.[1]?.createdAt : el?.[0]?.createAt,
      };
    });
  };
  const { data: personalChatList } = useQuery('findmychat', personalChat);

  // 보내는 메시지
  const handleSendMsg = (msg: any) => {
    currentChat.chat === 0
      ? socketRef.current.emit('user-send', {
          userid: userInfo.id,
          name: userInfo.name,
          content: msg,
          roomid: roomId,
        })
      : socketRef.current.emit('room-send', {
          userid: userInfo.id,
          name: userInfo.name,
          content: msg,
          roomid: roomId,
        });

    if (scrollbarRef.current) {
      setTimeout(() => {
        scrollbarRef.current?.scrollToBottom();
      }, 50);
    }
  };

  const listData = makeList([groupChatList, personalChatList]);

  return (
    <>
      <ChatWrapper>
        <LeftContainer>
          <div className="user">
            <div className="userImg">
              <img
                src={userInfo.url ? userInfo.url : ''}
                onError={e => {
                  e.currentTarget.src = '/images/profileDefault.png';
                }}
              />
            </div>
            <p className="userName">{userInfo.name}</p>
          </div>

          <ChatList setCurrentChat={setCurrentChat} chatUserList={listData} />
        </LeftContainer>

        <RightContainer>
          {currentChat === undefined ? (
            <BeforeChat />
          ) : (
            <>
              <div className="user">
                <div className="userImg">
                  <img
                    src={currentChat?.user?.url}
                    onError={e => {
                      e.currentTarget.src = '/images/profileDefault.png';
                    }}
                  />
                </div>
                <p className="userName">{currentChat?.user?.name}</p>
              </div>

              <ChatContainer
                roomId={roomId}
                ref={scrollbarRef}
                currentChat={currentChat}
                socketRef={socketRef}
              />

              <ChatInput handleSendMsg={handleSendMsg} />
            </>
          )}
        </RightContainer>
      </ChatWrapper>
    </>
  );
};
