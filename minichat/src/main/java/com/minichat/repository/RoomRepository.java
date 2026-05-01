package com.minichat.repository;

import com.minichat.entity.Room;
import com.minichat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findAll();
    Optional<Room> findById(Long id);
    List<Room> findByCreatedBy(User user);
}
