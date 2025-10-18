import { Group, rem, Text, UnstyledButton, Avatar, Menu, NavLink, Badge, Tooltip, Flex } from '@mantine/core';
import { IconChevronRight, IconLogout, IconSettings, IconHome2, IconUser } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '@/lib/api/auth';
import { useUserStore } from '@/lib/store/useUserStore';
import classes from './UserMenu.module.css';
import { scoreApi } from '@config/backend';

interface UserMenuProps {
  onLogoutSuccess: () => void;
  onLoginClick: () => void;
}

const UserMenu = ({ onLogoutSuccess, onLoginClick }: UserMenuProps) => {
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const user = useUserStore((state) => state.user);
  const [score, setScore] = useUserStore((state) => [state.userScore, state.setUserScore]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || getCurrentUser()?.displayName || 'User');
      setProfilePic(user.profilePic || getCurrentUser()?.photoURL || '');
      getUserScore();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      console.log('User signed out');
      onLogoutSuccess();
    } catch (error) {
      console.log('Error signing out', error);
    }
  };

  const getUserScore = () => {
    if (user == null) return;
    scoreApi.getScore({ userId: user.id }).then((points) => {
      setScore(points);
    });
  };

  if (!user) {
    return (
      <NavLink
        className="hover:text-green-800 hover:bg-white focus:bg-white active:bg-white"
        href=""
        label="Login"
        leftSection={<IconHome2 size="1.5rem" stroke={1.5} />}
        onClick={(event) => {
          event.preventDefault();
          onLoginClick();
        }}
      />
    );
  }

  return (
    <Menu shadow="md" width={200} position="right-end" withArrow>
      <Menu.Target>
        <UnstyledButton className={classes.user}>
          <Group justify="space-between" w="100%">
            <div style={{ position: 'relative' }}>
              <Avatar src={profilePic} radius="xl" className={classes.avatar} />
              <Tooltip label='Your ChaChing Score' withArrow>
              <Badge
                color="deeppink"
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-20px',
                  zIndex: 100,
                }}
              >
                {score}
              </Badge>
              </Tooltip>
            </div>
            {/* Ensure username and ChevronRight align properly */}
            <Flex align="center" gap="xs">
              <Text size="md" fw={500}>
                {username}
              </Text>
              <IconChevronRight style={{ width: rem(14), height: rem(14) }} stroke={1.5} />
            </Flex>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          component="a"
          href={`/profile/${user.username}?userId=${user.id}`}
          leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
        >
          Profile
        </Menu.Item>
        <Menu.Item
          component="a"
          href="/settings"
          leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
        >
          Settings
        </Menu.Item>
        <Menu.Item
          onClick={handleLogout}
          leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default UserMenu;
